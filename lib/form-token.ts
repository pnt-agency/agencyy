import { createHmac, timingSafeEqual } from "crypto";

/**
 * A short-lived, signed token issued when a public form renders and checked
 * when it submits.
 *
 * ## What this actually proves
 *
 * Only that the submitter fetched a token before submitting, and that some
 * plausible amount of time passed in between. That is enough to stop the
 * cheapest and most common attack by a wide margin — a script that POSTs
 * straight at the Server Action endpoint, never loading the page, thousands of
 * times an hour. That is exactly the traffic pattern in the spam we saw.
 *
 * ## What it does not prove
 *
 * It is **not** replay-proof. Nothing here is stored server-side, so a token is
 * valid for its whole lifetime and can be reused. A bot that bothers to request
 * one token and reuse it, sleeping a couple of seconds between posts, defeats
 * this check entirely.
 *
 * That is a deliberate stopping point, not an oversight. Making tokens
 * single-use means a storage round-trip per form render, and a bot willing to
 * do that work is equally willing to fetch a fresh token each time — so the
 * added cost buys very little. Replay is handled by the layers that don't care
 * how the request was constructed: the IP rate limit bounds volume, and
 * Turnstile is what actually asks "are you a browser with a human behind it".
 *
 * Treat this as the cheap filter that removes the bulk of the noise before the
 * expensive checks run.
 */

// Long enough that someone who opens a form, gets distracted, and comes back
// after lunch is not told their submission is invalid — losing a real lead to a
// bot countermeasure is a worse outcome than the replay window this permits.
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

// A human cannot read and complete a ten-field form in under two seconds.
// Deliberately conservative: browser autofill plus an immediate click is the
// fast legitimate case, and it is comfortably slower than this.
const MIN_AGE_MS = 2000;

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) {
    // Fail loudly rather than silently signing with a constant: a predictable
    // key makes every token forgeable, which is worse than no token at all.
    throw new Error("NEXTAUTH_SECRET is not set — cannot sign form tokens.");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Constant-time comparison — a fast reject leaks the signature byte by byte. */
function signatureMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  // timingSafeEqual throws on a length mismatch, which is itself a length
  // oracle, but signature length is fixed and public here so there is nothing
  // to learn from it.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Mints a token stamped with the current time. */
export function issueFormToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export type FormTokenResult =
  | { valid: true }
  | { valid: false; reason: "missing" | "malformed" | "forged" | "too_fast" | "expired" };

/** Checks a token's signature and age. */
export function verifyFormToken(token: unknown): FormTokenResult {
  if (typeof token !== "string" || token.length === 0) {
    return { valid: false, reason: "missing" };
  }

  const separator = token.indexOf(".");
  if (separator <= 0) return { valid: false, reason: "malformed" };

  const issuedAtRaw = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isInteger(issuedAt) || issuedAt <= 0) {
    return { valid: false, reason: "malformed" };
  }

  // Signature first: age is only meaningful once the timestamp is known to be
  // ours rather than one the caller chose.
  if (!signatureMatches(sign(issuedAtRaw), signature)) {
    return { valid: false, reason: "forged" };
  }

  const age = Date.now() - issuedAt;
  // A negative age means a token stamped in the future. The signature says we
  // minted it, so this is clock skew between instances rather than an attack —
  // treat it as freshly issued and let the min-age check below apply.
  if (age > MAX_AGE_MS) return { valid: false, reason: "expired" };
  if (age < MIN_AGE_MS) return { valid: false, reason: "too_fast" };

  return { valid: true };
}
