import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

/**
 * Cloudflare R2 object storage. R2 speaks the S3 API, so this is the AWS SDK
 * pointed at an R2 endpoint — which also means swapping to S3 later is a config
 * change rather than a rewrite.
 *
 * One private bucket, nothing in it ever public:
 *   - CVs (cv/ prefix) are read only through a one-minute presigned GET issued
 *     to an admin, forced to download;
 *   - training videos (training/ prefix) are read through a presigned GET
 *     minted each time a signed-in member or admin loads a training page.
 *
 * Videos were originally meant for a public bucket on a custom domain. That
 * needs the domain's DNS on Cloudflare, which amarispartners.com's isn't — and
 * the Terms of Use treat the training modules as confidential anyway, which a
 * public URL anyone can share doesn't honour. A presigned URL still supports
 * range requests, so seeking works; signing is a local HMAC, not a network call.
 *
 * Uploads never pass through our server. A Vercel serverless request body caps
 * at 4.5MB and a Server Action body defaults to 1MB — either would make video
 * upload impossible and CV upload fragile. Instead the browser PUTs directly to
 * R2 using a presigned URL, and the server's only job is to decide whether the
 * upload is allowed and to pin what may be sent.
 */

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const PRIVATE_BUCKET = process.env.R2_BUCKET;

// Built lazily and only when configured, mirroring lib/resend.ts: an unset key
// must not break importing this module in an environment that doesn't use it.
const client =
  ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
        // Without this the SDK bakes a CRC32 of an *empty* body into every
        // presigned PUT (x-amz-checksum-crc32=AAAAAA==). The browser then sends
        // real bytes, the checksum doesn't match, and the upload is rejected —
        // so every upload would fail. Checksums are for requests the SDK sends
        // itself; a presigned URL is handed to someone else.
        requestChecksumCalculation: "WHEN_REQUIRED",
      })
    : null;

export function isCvStorageConfigured(): boolean {
  return Boolean(client && PRIVATE_BUCKET);
}

export function isVideoStorageConfigured(): boolean {
  // Same bucket as CVs; kept as its own check so callers read for what they mean.
  return Boolean(client && PRIVATE_BUCKET);
}

// ---------- Upload limits ----------

export const CV_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024; // 500MB

export const CV_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
};

export const VIDEO_CONTENT_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * Builds the object key. The caller never chooses it: a client-supplied path
 * could escape its prefix or collide with someone else's file, so the original
 * filename is kept only as metadata in Postgres, never in the key.
 */
function buildKey(prefix: string, extension: string): string {
  return `${prefix}/${randomUUID()}.${extension}`;
}

type PresignedUpload = { url: string; key: string };

async function presignPut(opts: {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn: number;
}): Promise<string> {
  if (!client) throw new Error("R2 is not configured.");
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
      ContentLength: opts.contentLength,
    }),
    {
      expiresIn: opts.expiresIn,
      // Both headers must be named explicitly. The SDK signs content-length by
      // default but *not* content-type, so without this a URL presigned for a
      // PDF would happily accept an executable of the same size. Signing both
      // means R2 rejects a mismatch, rather than us trusting the browser.
      signableHeaders: new Set(["content-type", "content-length"]),
    }
  );
}

/** Presigns a CV upload into the private bucket. */
export async function presignCvUpload(
  contentType: string,
  contentLength: number
): Promise<PresignedUpload> {
  if (!PRIVATE_BUCKET) throw new Error("R2_BUCKET is not configured.");
  const extension = CV_CONTENT_TYPES[contentType];
  if (!extension) throw new Error("Unsupported CV file type.");

  const key = buildKey("cv", extension);
  const url = await presignPut({
    bucket: PRIVATE_BUCKET,
    key,
    contentType,
    contentLength,
    expiresIn: 300, // 5 minutes to start and finish a ≤10MB upload
  });
  return { url, key };
}

/** Presigns a training video upload into the private bucket. */
export async function presignVideoUpload(
  contentType: string,
  contentLength: number
): Promise<PresignedUpload> {
  if (!PRIVATE_BUCKET) throw new Error("R2_BUCKET is not configured.");
  const extension = VIDEO_CONTENT_TYPES[contentType];
  if (!extension) throw new Error("Unsupported video file type.");

  const key = buildKey("training", extension);
  const url = await presignPut({
    bucket: PRIVATE_BUCKET,
    key,
    contentType,
    contentLength,
    expiresIn: 3600, // an hour — a 500MB upload on a slow line needs the room
  });
  return { url, key };
}

/**
 * Short-lived download link for a stored CV.
 *
 * Forces an attachment disposition on the way out. Without it a stored HTML or
 * SVG file would render in the browser under R2's origin; as a download it is
 * inert whatever it actually contains — which matters because direct-to-storage
 * uploads mean the bytes were never inspected server-side.
 */
export async function presignCvDownload(key: string, filename: string): Promise<string> {
  if (!client || !PRIVATE_BUCKET) throw new Error("R2 is not configured.");
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\]/g, "")}"`,
    }),
    { expiresIn: 60 }
  );
}

/**
 * How long a video link stays valid. Long enough to watch a module and come
 * back to it later in the same sitting — seeking re-requests the same URL, so
 * a link that expired mid-video would break the scrubber. A reload mints a new
 * one.
 */
export const VIDEO_VIEW_TTL_SECONDS = 6 * 60 * 60;

/** The MIME type a training video is served as, from its key's extension. */
function videoTypeForKey(key: string): string {
  const extension = key.slice(key.lastIndexOf(".") + 1);
  const type = Object.entries(VIDEO_CONTENT_TYPES).find(([, ext]) => ext === extension)?.[0];
  if (!key.startsWith("training/") || !type) {
    throw new Error("Not a training video key.");
  }
  return type;
}

/**
 * A time-limited link to watch a training video. Only call this for someone
 * already authorised to see the page it's rendered on — the link itself is the
 * permission.
 *
 * The response type is pinned to the video type the key was issued for, so
 * whatever bytes are stored, the browser is told it's a video.
 */
export async function presignVideoView(key: string): Promise<string> {
  if (!client || !PRIVATE_BUCKET) throw new Error("R2 is not configured.");
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: key,
      ResponseContentType: videoTypeForKey(key),
    }),
    { expiresIn: VIDEO_VIEW_TTL_SECONDS }
  );
}

/**
 * A watch link for a module's video, or null when there's nothing to show —
 * no video yet, storage unconfigured, or a key that can't be signed. Pages
 * render null as "coming soon"; a half-configured deploy must not 500.
 */
export async function videoLinkFor(key: string | null): Promise<string | null> {
  if (!key || !isVideoStorageConfigured()) return null;
  try {
    return await presignVideoView(key);
  } catch (error) {
    console.error("Could not sign a training video link:", error);
    return null;
  }
}

/** Best-effort cleanup when a stored object is replaced or its row is removed. */
export async function deleteObject(key: string): Promise<void> {
  if (!client || !PRIVATE_BUCKET) return;
  await client.send(new DeleteObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }));
}
