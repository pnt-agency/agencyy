import { incrementRateLimit, deleteExpiredRateLimits } from "./db/queries";
import { clientIp } from "./client-ip";

/**
 * Fixed-window IP rate limiting for the public endpoints.
 *
 * ## Why fixed windows
 *
 * A fixed window has a known flaw: a caller can spend its whole allowance at
 * the end of one window and again at the start of the next, so the true
 * worst-case burst is 2x the limit. A sliding window would fix that, at the
 * cost of storing every request timestamp.
 *
 * That tradeoff is worth taking here. The adversary is a spam bot posting
 * hundreds of submissions an hour, not someone shaving a factor of two off a
 * boundary. Ten-per-hour becoming twenty-in-a-bad-minute still ends the abuse;
 * per-request rows would add write volume for no meaningful gain.
 *
 * ## What this is not
 *
 * This limits by IP, and IPs are cheap — a botnet or a rotating proxy pool
 * walks straight past it. It is one layer of several (see the form token,
 * honeypot and Turnstile checks in the submit actions), and the only one of
 * them that also bounds cost when the others are misconfigured.
 */

export type RateLimitRule = {
  /** Names what is being limited; combined with the caller's IP to form a key. */
  readonly name: string;
  /** Maximum requests allowed per window. */
  readonly limit: number;
  /** Window length in milliseconds. */
  readonly windowMs: number;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * The rules, in one place so the numbers can be read against each other rather
 * than hunted for across call sites.
 *
 * These are all far above real human use — someone filling in a hiring form
 * twice because they mistyped an address must never see a limit — and far
 * below what the observed bot traffic was doing (hundreds per hour).
 */
export const RATE_LIMITS = {
  EMPLOYER_INQUIRY: { name: "hire", limit: 5, windowMs: HOUR },
  TALENT_APPLICATION: { name: "apply", limit: 5, windowMs: HOUR },
  // Higher, because one application legitimately involves a retry or two, and
  // the per-file cost is bounded by the presign itself (single object, pinned
  // type and size). This exists to cap how much a script can make us store.
  CV_PRESIGN: { name: "cv-presign", limit: 20, windowMs: HOUR },
  // Deliberately tight: every allowed request sends an email to an address the
  // caller chose, which is the whole mechanism of an email-bombing campaign.
  PASSWORD_RESET: { name: "password-reset", limit: 5, windowMs: HOUR },
  // Account creation also sends mail (the verification link).
  REGISTER: { name: "register", limit: 5, windowMs: HOUR },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/** Start of the fixed window the given moment falls in. */
function windowStart(now: number, windowMs: number): Date {
  return new Date(Math.floor(now / windowMs) * windowMs);
}

// Sweeping on every call would double the write volume for no benefit — expired
// rows are harmless, just untidy. Doing it on roughly 1% of calls keeps the
// table from growing without bound while costing nothing on the hot path.
const SWEEP_PROBABILITY = 0.01;

async function sweepExpired(windowMs: number): Promise<void> {
  if (Math.random() >= SWEEP_PROBABILITY) return;
  try {
    // One full window of slack, so a row is only ever deleted well after it
    // stopped being consulted.
    await deleteExpiredRateLimits(new Date(Date.now() - windowMs * 2));
  } catch (error) {
    console.warn("Rate limit sweep failed:", error);
  }
}

/**
 * Counts one request from `identifier` against `rule`.
 *
 * ## Failure behaviour: open, deliberately
 *
 * If the database is unreachable this returns `allowed`. That is a real
 * tradeoff and the wrong one for a login throttle — but these call sites are
 * public forms, and failing closed would turn a database blip into "nobody can
 * contact the company", converting a partial outage into a total one. The
 * checks that don't depend on the database (form token, honeypot, Turnstile)
 * still run, so an outage degrades the defence rather than removing it.
 */
export async function checkRateLimit(
  rule: RateLimitRule,
  identifier: string | null
): Promise<RateLimitResult> {
  // No identifier means no way to attribute the request. Allow it — the
  // alternative is one shared bucket for every un-attributable caller, which
  // one bot could exhaust to lock out everyone else.
  if (!identifier) return { allowed: true };

  const now = Date.now();
  const start = windowStart(now, rule.windowMs);

  try {
    const used = await incrementRateLimit(`${rule.name}:${identifier}`, start);
    void sweepExpired(rule.windowMs);

    if (used > rule.limit) {
      return { allowed: false, retryAfterMs: start.getTime() + rule.windowMs - now };
    }
    return { allowed: true };
  } catch (error) {
    console.error("Rate limit check failed (allowing request):", error);
    return { allowed: true };
  }
}

/** `checkRateLimit` keyed on the caller's IP address. */
export async function checkIpRateLimit(rule: RateLimitRule): Promise<RateLimitResult> {
  return checkRateLimit(rule, await clientIp());
}

/**
 * A refusal message for a blocked caller.
 *
 * Says only "too many, wait" — never how many are allowed, or how long the
 * window is. Publishing the exact shape of the limit tells a bot precisely what
 * rate to back off to in order to keep going undetected.
 */
export function rateLimitMessage(result: { retryAfterMs: number }): string {
  const minutes = Math.max(1, Math.ceil(result.retryAfterMs / MINUTE));
  return `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
