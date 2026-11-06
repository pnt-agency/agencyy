import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { issueFormToken, verifyFormToken } from "./form-token";

const SECRET = "test-secret-for-form-tokens";

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = SECRET;
});

afterEach(() => {
  vi.useRealTimers();
});

/** Builds a token for an arbitrary timestamp, signed with the real key. */
function tokenFor(issuedAt: number): string {
  const payload = String(issuedAt);
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
}

describe("issueFormToken", () => {
  it("produces a timestamp.signature pair", () => {
    expect(issueFormToken()).toMatch(/^\d+\.[A-Za-z0-9_-]+$/);
  });

  it("throws rather than signing with a predictable key when the secret is absent", () => {
    delete process.env.NEXTAUTH_SECRET;
    expect(() => issueFormToken()).toThrow(/NEXTAUTH_SECRET/);
  });
});

describe("verifyFormToken", () => {
  it("accepts a token once the minimum age has passed", () => {
    expect(verifyFormToken(tokenFor(Date.now() - 10_000))).toEqual({ valid: true });
  });

  it("rejects a token that is missing entirely", () => {
    // The case that matters most: a script POSTing straight at the action.
    expect(verifyFormToken(undefined)).toEqual({ valid: false, reason: "missing" });
    expect(verifyFormToken("")).toEqual({ valid: false, reason: "missing" });
    expect(verifyFormToken(12345)).toEqual({ valid: false, reason: "missing" });
  });

  it("rejects a malformed token", () => {
    expect(verifyFormToken("no-separator")).toEqual({ valid: false, reason: "malformed" });
    expect(verifyFormToken(".sig")).toEqual({ valid: false, reason: "malformed" });
    expect(verifyFormToken("notanumber.sig")).toEqual({ valid: false, reason: "malformed" });
  });

  it("rejects a token whose timestamp was altered", () => {
    // An attacker backdating a fresh token to slip past the minimum age must
    // not be able to keep the signature valid.
    const token = tokenFor(Date.now() - 10_000);
    const forged = `${Date.now() - 60_000}.${token.split(".")[1]}`;
    expect(verifyFormToken(forged)).toEqual({ valid: false, reason: "forged" });
  });

  it("rejects a token signed with a different secret", () => {
    const payload = String(Date.now() - 10_000);
    const wrong = createHmac("sha256", "some-other-secret").update(payload).digest("base64url");
    expect(verifyFormToken(`${payload}.${wrong}`)).toEqual({ valid: false, reason: "forged" });
  });

  it("rejects a submission that arrived implausibly fast", () => {
    expect(verifyFormToken(tokenFor(Date.now()))).toEqual({ valid: false, reason: "too_fast" });
  });

  it("rejects an expired token", () => {
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
    expect(verifyFormToken(tokenFor(fourHoursAgo))).toEqual({ valid: false, reason: "expired" });
  });

  it("accepts a token just inside the expiry window", () => {
    const almostThreeHours = Date.now() - (3 * 60 * 60 * 1000 - 5_000);
    expect(verifyFormToken(tokenFor(almostThreeHours))).toEqual({ valid: true });
  });

  it("treats a future-dated token as not yet old enough rather than valid", () => {
    // Clock skew between instances, not an attack — but it must not bypass the
    // minimum age check.
    expect(verifyFormToken(tokenFor(Date.now() + 60_000))).toEqual({
      valid: false,
      reason: "too_fast",
    });
  });
});
