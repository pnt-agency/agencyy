import { describe, it, expect, beforeAll } from "vitest";

// The module reads credentials at import time, so the environment has to be in
// place first. These are throwaway values — the AWS SDK signs locally and makes
// no network call, so a presigned URL can be asserted on without real R2.
beforeAll(() => {
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY_ID = "test-key-id";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret";
  process.env.R2_BUCKET = "cvs-private";
  process.env.R2_PUBLIC_BUCKET = "media-public";
  process.env.R2_PUBLIC_BASE_URL = "https://media.example.com/";
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
    expect(url).toContain("cvs-private");
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
  it("targets the public bucket under a training/ prefix", async () => {
    const { presignVideoUpload } = await r2();
    const { url, key } = await presignVideoUpload("video/mp4", 5_000_000);
    expect(key).toMatch(/^training\/[0-9a-f-]{36}\.mp4$/);
    expect(url).toContain("media-public");
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

describe("videoUrl", () => {
  it("joins the custom domain to the key without a double slash", async () => {
    const { videoUrl } = await r2();
    // The configured base URL above has a trailing slash on purpose.
    expect(videoUrl("training/abc.mp4")).toBe("https://media.example.com/training/abc.mp4");
  });
});
