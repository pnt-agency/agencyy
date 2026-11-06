/**
 * The parts of two-step verification the browser needs too: the code length
 * and the error codes the sign-in form reacts to. Kept apart from
 * lib/two-step.ts, which uses node:crypto and must never reach a client bundle.
 */

export const TWO_STEP_CODE_LENGTH = 6;

/**
 * Thrown from the credentials provider's authorize(). NextAuth hands the error
 * message back to signIn() as `result.error`, which is how the sign-in form
 * knows to ask for a code rather than report a wrong password.
 */
export const TWO_STEP_ERRORS = {
  /** Password was right; a code has been emailed and is now needed. */
  REQUIRED: "TWO_STEP_REQUIRED",
  /** The code entered is wrong or has expired. */
  INVALID: "TWO_STEP_INVALID",
  /** Too many codes requested or guessed for this account; wait and retry. */
  RATE_LIMITED: "TWO_STEP_RATE_LIMITED",
  /** The code couldn't be emailed. */
  SEND_FAILED: "TWO_STEP_SEND_FAILED",
} as const;

/**
 * Accepts what people actually type or paste — "123 456", "123-456" — and
 * returns the bare digits, or null when it can't be a code at all.
 */
export function normalizeTwoStepCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[\s-]/g, "");
  return new RegExp(`^\\d{${TWO_STEP_CODE_LENGTH}}$`).test(digits) ? digits : null;
}
