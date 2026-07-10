import { randomBytes, createHash } from "node:crypto";

// Verification / reset tokens: a random raw token goes in the emailed link; only
// its SHA-256 hash is persisted, so a DB leak can't be used to forge links.

export const VERIFY_EMAIL = "verify_email";
export const RESET_PASSWORD = "reset_password";

export const TOKEN_TTL_MS = {
  [VERIFY_EMAIL]: 24 * 60 * 60 * 1000, // 24h
  [RESET_PASSWORD]: 60 * 60 * 1000, // 1h
} as const;

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function tokenExpiry(purpose: keyof typeof TOKEN_TTL_MS): Date {
  return new Date(Date.now() + TOKEN_TTL_MS[purpose]);
}

// Base URL for building links in emails.
export function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
