import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

/**
 * Cloudflare R2 object storage. R2 speaks the S3 API, so this is the AWS SDK
 * pointed at an R2 endpoint — which also means swapping to S3 later is a config
 * change rather than a rewrite.
 *
 * Two buckets, because R2 grants public access per bucket:
 *   - the private bucket holds CVs, and is only ever read through a short-lived
 *     presigned GET issued to an admin;
 *   - the public bucket holds training videos, served straight off a Cloudflare
 *     custom domain so the CDN can cache them and range requests (seeking) work
 *     without a presign round-trip per view.
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
const PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET;
// Custom domain bound to the public bucket, e.g. https://media.amarispartners.com
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

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
  return Boolean(client && PUBLIC_BUCKET && PUBLIC_BASE_URL);
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

/** Presigns a training video upload into the public bucket. */
export async function presignVideoUpload(
  contentType: string,
  contentLength: number
): Promise<PresignedUpload> {
  if (!PUBLIC_BUCKET) throw new Error("R2_PUBLIC_BUCKET is not configured.");
  const extension = VIDEO_CONTENT_TYPES[contentType];
  if (!extension) throw new Error("Unsupported video file type.");

  const key = buildKey("training", extension);
  const url = await presignPut({
    bucket: PUBLIC_BUCKET,
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

/** Public CDN URL for a training video. */
export function videoUrl(key: string): string {
  if (!PUBLIC_BASE_URL) throw new Error("R2_PUBLIC_BASE_URL is not configured.");
  return `${PUBLIC_BASE_URL}/${key}`;
}

/** Best-effort cleanup when a stored object is replaced or its row is removed. */
export async function deleteObject(bucket: "private" | "public", key: string): Promise<void> {
  const target = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  if (!client || !target) return;
  await client.send(new DeleteObjectCommand({ Bucket: target, Key: key }));
}
