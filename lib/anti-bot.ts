import { verifyFormToken } from "./form-token";
import { verifyTurnstileToken, isTurnstileConfigured } from "./turnstile";
import { checkIpRateLimit, rateLimitMessage, type RateLimitRule } from "./rate-limit";

/**
 * The shared anti-abuse gate for the public submission actions.
 *
 * Four independent checks, run cheapest-first, each covering a different way
 * the previous one can be beaten:
 *
 * 1. **Honeypot** — a field no human can see. Free, and catches form-filling
 *    bots that populate every input they find.
 * 2. **Form token** — proves a page was loaded first and that time passed.
 *    Free, and catches scripts that POST straight at the action endpoint.
 * 3. **Rate limit** — one database round-trip. Bounds volume regardless of how
 *    convincing the request looks.
 * 4. **Turnstile** — a network call to Cloudflare, so it runs last. The only
 *    check that genuinely asks whether a human is present.
 *
 * The ordering is a cost decision, not a strength ranking: the weakest checks
 * are first precisely because they are free to run, so obvious junk is rejected
 * before anything expensive happens.
 *
 * A consequence worth being explicit about: a request rejected by check 1 or 2
 * is never counted against the rate limit. That is intentional — those requests
 * are already refused, and counting them would mean a database write for every
 * piece of junk traffic, which is the cost this is meant to avoid.
 */

export type AntiBotFields = {
  /** The honeypot input's value. Any content at all means a bot filled it. */
  honeypot?: unknown;
  /** The signed token issued when the form rendered. */
  formToken?: unknown;
  /** The Turnstile response token, when Turnstile is configured. */
  turnstileToken?: unknown;
};

export type ScreenResult =
  | {
      ok: true;
      /**
       * Whether Turnstile actually ran and passed, as opposed to being skipped
       * because no secret key is configured.
       *
       * Callers use this to decide whether to send mail to the address on the
       * submission. Emailing an unproven address is what let bots use this app
       * to deliver unsolicited mail under its own domain, so that only happens
       * once something has established a human is behind the request.
       */
      captchaVerified: boolean;
    }
  | { ok: false; error: string };

/**
 * Deliberately vague. Naming the failed check tells a bot author exactly what
 * to fix; a real user who somehow trips one of these is served just as well by
 * "try again", and the specifics go to the server log instead.
 */
const GENERIC_REJECTION = "We couldn't verify that submission. Please reload the page and try again.";

function reject(logReason: string, context: string, error = GENERIC_REJECTION): ScreenResult {
  console.warn(`[anti-bot] rejected ${context}: ${logReason}`);
  return { ok: false, error };
}

/**
 * Screens one public submission.
 *
 * @param rule    Which rate limit applies to this endpoint.
 * @param fields  The anti-bot fields carried alongside the real form data.
 * @param context A short label for the server log, e.g. "employer inquiry".
 */
export async function screenSubmission(
  rule: RateLimitRule,
  fields: AntiBotFields,
  context: string
): Promise<ScreenResult> {
  // 1. Honeypot. Hidden from real users, so any value is a bot.
  if (typeof fields.honeypot === "string" && fields.honeypot.trim() !== "") {
    return reject("honeypot filled", context);
  }

  // 2. Form token.
  const token = verifyFormToken(fields.formToken);
  if (!token.valid) {
    // "Too fast" is the one failure a real person can plausibly hit — browser
    // autofill followed by an instant click. Retrying takes longer than the
    // threshold by definition, so tell them to just do that.
    if (token.reason === "too_fast") {
      return reject("submitted too fast", context, "That was submitted a little too quickly. Please try again.");
    }
    return reject(`form token ${token.reason}`, context);
  }

  // 3. Rate limit.
  const limit = await checkIpRateLimit(rule);
  if (!limit.allowed) {
    return reject("rate limited", context, rateLimitMessage(limit));
  }

  // 4. Turnstile. Skipped when unconfigured; see lib/turnstile.ts.
  const configured = isTurnstileConfigured();
  const captcha = await verifyTurnstileToken(fields.turnstileToken);
  if (!captcha.ok) {
    return reject(`turnstile: ${captcha.reason}`, context);
  }

  return { ok: true, captchaVerified: configured };
}
