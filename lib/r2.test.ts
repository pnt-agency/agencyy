import { describe, it, expect, beforeAll } from "vitest";

// The module reads credentials at import time, so the environment has to be in
// place first. These are throwaway values — the AWS SDK signs locally and makes
// no network call, so a presigned URL can be asserted on without real R2.
beforeAll(() => {
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY_ID = "test-key-id";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret";
  process.env.R2_BUCKET = "amaris-private";
});

async function r2() {
  return import("./r2");
}

describe("configuration", () => {
  it("reports both storage kinds as configured", async () => {
    const { isCvStorageConfigured, isVideoStorageConfigured } = await r2();
    expect(isCvStorageConfigured()).toBe(true);
    expect(isVideoStorageConfigured()).toBe(true);
  });
});

describe("presignCvUpload", () => {
  it("puts the object under a cv/ prefix with a uuid name", async () => {
    const { presignCvUpload } = await r2();
    const { key } = await presignCvUpload("application/pdf", 1024);
    // The apply action re-validates against this exact shape, so the two must
    // agree — a drift here would reject every real upload.
    expect(key).toMatch(/^cv\/[0-9a-f-]{36}\.pdf$/);
  });

  it("maps docx to its own extension", async () => {
    const { presignCvUpload } = await r2();
    const { key } = await presignCvUpload(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      2048
    );
    expect(key.endsWith(".docx")).toBe(true);
  });

  it("never reuses a key", async () => {
    const { presignCvUpload } = await r2();
    const [a, b] = await Promise.all([
      presignCvUpload("application/pdf", 10),
      presignCvUpload("application/pdf", 10),
    ]);
    expect(a.key).not.toBe(b.key);
  });

  it("signs the content type and length into the URL", async () => {
    const { presignCvUpload } = await r2();
    const { url } = await presignCvUpload("application/pdf", 4096);
    const signed = new URL(url).searchParams.get("X-Amz-SignedHeaders") ?? "";
    // These being *signed* is what stops a presigned URL for a small PDF from
    // being reused to push a huge file, or a different kind of object.
    // content-type in particular is not signed by default — it only appears
    // here because signableHeaders names it.
    expect(signed).toContain("content-type");
    expect(signed).toContain("content-length");
  });

  it("does not bake a checksum into the URL", async () => {
    const { presignCvUpload } = await r2();
    const { url } = await presignCvUpload("application/pdf", 4096);
    // The SDK otherwise presigns a CRC32 of an empty body, which every real
    // upload then fails to match. This asserts the client-level opt-out holds.
    expect(url).not.toContain("checksum");
  });

  it("targets the private bucket and expires quickly", async () => {
    const { presignCvUpload } = await r2();
    const { url } = await presignCvUpload("application/pdf", 4096);
    expect(url).toContain("amaris-private");
    expect(new URL(url).searchParams.get("X-Amz-Expires")).toBe("300");
  });

  it("rejects a type outside the allowlist", async () => {
    const { presignCvUpload } = await r2();
    await expect(presignCvUpload("application/x-msdownload", 1024)).rejects.toThrow(
      /Unsupported/
    );
  });
});

describe("presignVideoUpload", () => {
  it("targets the private bucket under a training/ prefix", async () => {
    const { presignVideoUpload } = await r2();
    const { url, key } = await presignVideoUpload("video/mp4", 5_000_000);
    expect(key).toMatch(/^training\/[0-9a-f-]{36}\.mp4$/);
    expect(url).toContain("amaris-private");
  });

  it("allows an hour, since 500MB on a slow line needs the room", async () => {
    const { presignVideoUpload } = await r2();
    const { url } = await presignVideoUpload("video/mp4", 5_000_000);
    expect(new URL(url).searchParams.get("X-Amz-Expires")).toBe("3600");
  });

  it("rejects a non-video type", async () => {
    const { presignVideoUpload } = await r2();
    await expect(presignVideoUpload("application/pdf", 1024)).rejects.toThrow(/Unsupported/);
  });
});

describe("presignCvDownload", () => {
  it("forces an attachment disposition", async () => {
    const { presignCvDownload } = await r2();
    const url = await presignCvDownload("cv/abc.pdf", "Ada Lovelace CV.pdf");
    const disposition = new URL(url).searchParams.get("response-content-disposition");
    // Without this a stored HTML or SVG would render in the browser under R2's
    // origin — direct-to-storage uploads mean the bytes were never inspected.
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("Ada Lovelace CV.pdf");
  });

  it("strips quotes from the filename so the header can't be broken out of", async () => {
    const { presignCvDownload } = await r2();
    const url = await presignCvDownload("cv/abc.pdf", 'evil".pdf');
    const disposition = new URL(url).searchParams.get("response-content-disposition") ?? "";
    expect(disposition).toBe('attachment; filename="evil.pdf"');
  });

  it("expires in a minute", async () => {
    const { presignCvDownload } = await r2();
    const url = await presignCvDownload("cv/abc.pdf", "cv.pdf");
    expect(new URL(url).searchParams.get("X-Amz-Expires")).toBe("60");
  });
});

describe("presignVideoView", () => {
  it("signs a link into the private bucket — nothing is served publicly", async () => {
    const { presignVideoView } = await r2();
    const url = new URL(await presignVideoView("training/abc.mp4"));
    // Virtual-hosted style: the bucket is the subdomain of the account endpoint.
    expect(url.hostname).toBe("amaris-private.test-account.r2.cloudflarestorage.com");
    expect(url.pathname).toBe("/training/abc.mp4");
    expect(url.searchParams.get("X-Amz-Signature")).toBeTruthy();
  });

  it("lasts long enough to watch and seek through a module", async () => {
    const { presignVideoView, VIDEO_VIEW_TTL_SECONDS } = await r2();
    const url = new URL(await presignVideoView("training/abc.mp4"));
    expect(url.searchParams.get("X-Amz-Expires")).toBe(String(VIDEO_VIEW_TTL_SECONDS));
    expect(VIDEO_VIEW_TTL_SECONDS).toBeGreaterThanOrEqual(60 * 60);
  });

  it("pins the response type to the video type the key was issued for", async () => {
    const { presignVideoView } = await r2();
    const mov = new URL(await presignVideoView("training/abc.mov"));
    expect(mov.searchParams.get("response-content-type")).toBe("video/quicktime");
    const webm = new URL(await presignVideoView("training/abc.webm"));
    expect(webm.searchParams.get("response-content-type")).toBe("video/webm");
  });

  it("refuses to sign anything that isn't a training video, such as a CV", async () => {
    const { presignVideoView } = await r2();
    await expect(presignVideoView("cv/abc.pdf")).rejects.toThrow(/training video/);
    await expect(presignVideoView("training/abc.html")).rejects.toThrow(/training video/);
  });
});

describe("videoLinkFor", () => {
  it("returns null rather than throwing, so a page can show 'coming soon'", async () => {
    const { videoLinkFor } = await r2();
    expect(await videoLinkFor(null)).toBeNull();
    expect(await videoLinkFor("cv/abc.pdf")).toBeNull();
    expect(await videoLinkFor("training/abc.mp4")).toContain("training/abc.mp4");
  });
});
