import { describe, it, expect, afterEach } from "vitest";
import {
  generateToken,
  hashToken,
  tokenExpiry,
  appBaseUrl,
  VERIFY_EMAIL,
  RESET_PASSWORD,
  TOKEN_TTL_MS,
} from "./tokens";

describe("generateToken", () => {
  it("returns a 64-char hex raw token and its sha-256 hash", () => {
    const { raw, hash } = generateToken();
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashToken(raw));
    expect(raw).not.toBe(hash);
  });

  it("produces a distinct token each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("hashToken", () => {
  it("is deterministic", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("tokenExpiry", () => {
  it("returns a future date matching the purpose TTL", () => {
    const before = Date.now();
    const verify = tokenExpiry(VERIFY_EMAIL).getTime();
    const reset = tokenExpiry(RESET_PASSWORD).getTime();
    expect(verify).toBeGreaterThan(before);
    // Reset TTL (1h) is shorter than verify TTL (24h).
    expect(reset - before).toBeLessThan(verify - before);
    expect(verify - before).toBeLessThanOrEqual(TOKEN_TTL_MS[VERIFY_EMAIL] + 50);
  });
});

describe("appBaseUrl", () => {
  const original = process.env.NEXTAUTH_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = original;
  });

  it("uses NEXTAUTH_URL without a trailing slash", () => {
    process.env.NEXTAUTH_URL = "https://app.example.com/";
    expect(appBaseUrl()).toBe("https://app.example.com");
  });

  it("falls back to localhost when unset", () => {
    delete process.env.NEXTAUTH_URL;
    expect(appBaseUrl()).toBe("http://localhost:3000");
  });
});
