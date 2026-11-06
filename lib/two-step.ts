import { createHmac, randomInt } from "node:crypto";
import {
  createAuthToken,
  deleteAuthToken,
  deleteAuthTokensFor,
  findValidAuthToken,
} from "./db/queries";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import { sendTwoStepCodeEmail } from "./resend";
import { TWO_STEP_CODE_LENGTH, normalizeTwoStepCode } from "./two-step-shared";

/**
 * Two-step verification by emailed one-time code (the "passcode" the Privacy
 * Policy promises).
 *
 * ## Storage
 *
 * Codes live in auth_tokens alongside verification and reset links, one live
 * code per (account, purpose). Only a keyed hash is stored. Unlike a 64-char
 * reset token, a six-digit code is guessable offline in milliseconds from a
 * plain hash — so the hash is an HMAC under the server secret, and a read-only
 * database leak doesn't hand anyone a valid code.
 *
 * ## What it protects
 *
 * Password sign-ins. Someone who has the password but not the inbox can't get
 * in. It is deliberately not applied to Google sign-in, which never touches the
 * password and is protected by the Google account's own two-step settings.
 */

/** Signing in with a password while two-step is on. */
export const SIGN_IN_CODE = "two_step_sign_in";
/** Proving the inbox works before two-step is switched on. */
export const SETUP_CODE = "two_step_setup";

export type TwoStepPurpose = typeof SIGN_IN_CODE | typeof SETUP_CODE;

export const CODE_TTL_MS = 10 * 60 * 1000;

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) {
    // Same reasoning as lib/form-token.ts: a constant key would make every
    // stored hash trivially reversible, which is worse than refusing.
    throw new Error("NEXTAUTH_SECRET is not set — cannot hash two-step codes.");
  }
  return value;
}

export function generateTwoStepCode(): string {
  // randomInt is uniform and uses the CSPRNG; padStart keeps leading zeros.
  return randomInt(0, 10 ** TWO_STEP_CODE_LENGTH).toString().padStart(TWO_STEP_CODE_LENGTH, "0");
}

/**
 * The stored form of a code. Bound to the account and purpose as well as the
 * digits, so the same six digits issued to two people (or for two purposes)
 * never produce the same hash — which matters because token_hash is unique.
 */
export function hashTwoStepCode(userId: string, purpose: TwoStepPurpose, code: string): string {
  return createHmac("sha256", secret()).update(`${purpose}:${userId}:${code}`).digest("hex");
}

export type IssueResult = "sent" | "rate_limited" | "send_failed";

/**
 * Creates a fresh code for the account (replacing any earlier one for the same
 * purpose) and emails it.
 */
export async function issueTwoStepCode(
  user: { id: string; email: string; name: string },
  purpose: TwoStepPurpose
): Promise<IssueResult> {
  const limit = await checkRateLimit(RATE_LIMITS.TWO_STEP_SEND, user.id);
  if (!limit.allowed) return "rate_limited";

  const code = generateTwoStepCode();
  await createAuthToken({
    userId: user.id,
    tokenHash: hashTwoStepCode(user.id, purpose, code),
    purpose,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  try {
    await sendTwoStepCodeEmail(user.email, user.name, code, purpose === SETUP_CODE ? "setup" : "sign-in");
    return "sent";
  } catch (error) {
    console.error("Two-step code email could not be sent:", error);
    // A code nobody received is only something to guess at; don't leave it live.
    await deleteAuthTokensFor(user.id, purpose);
    return "send_failed";
  }
}

export type VerifyResult = "ok" | "invalid" | "rate_limited";

/**
 * Checks a code the person typed. A correct code is consumed, so it can't be
 * used twice.
 */
export async function verifyTwoStepCode(
  userId: string,
  purpose: TwoStepPurpose,
  input: unknown
): Promise<VerifyResult> {
  // Counted before anything else, including malformed input — every attempt is
  // a guess as far as the budget is concerned.
  const limit = await checkRateLimit(RATE_LIMITS.TWO_STEP_VERIFY, userId);
  if (!limit.allowed) return "rate_limited";

  const code = normalizeTwoStepCode(input);
  if (!code) return "invalid";

  const token = await findValidAuthToken(hashTwoStepCode(userId, purpose, code), purpose);
  if (!token || token.userId !== userId) return "invalid";

  await deleteAuthToken(token.id);
  return "ok";
}
