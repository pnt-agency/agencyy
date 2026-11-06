import { clientIp } from "./client-ip";

/**
 * Cloudflare Turnstile verification for the public forms.
 *
 * Turnstile is the control that actually distinguishes a browser driven by a
 * person from a script. Everything else in the anti-abuse stack bounds the
 * damage a bot can do; this is the part that tries to keep it out.
 *
 * Set up: create a widget at dash.cloudflare.com → Turnstile, then set
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY (public, rendered into the page) and
 * TURNSTILE_SECRET_KEY (server-only, never exposed).
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare's documented ceiling for a token; anything longer is not one.
const MAX_TOKEN_LENGTH = 2048;

// A verification that hangs must not hang the submission behind it.
const TIMEOUT_MS = 10_000;

/** Whether a secret key is configured. When false, verification is skipped. */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export type TurnstileResult =
  | { ok: true }
  /** `reason` is for the server log, never for the caller. */
  | { ok: false; reason: string };

type SiteVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

/**
 * Verifies a Turnstile token with Cloudflare.
 *
 * ## Unconfigured means skipped — on purpose, and it is a real gap
 *
 * With no TURNSTILE_SECRET_KEY set this returns ok. The alternative — refusing
 * every submission until the keys are in place — would take both public forms
 * offline the moment this deploys, before anyone had a chance to create the
 * widget.
 *
 * The consequence is that **until the keys are configured in production, the
 * strongest layer of this defence is not running.** The rate limit, form token,
 * honeypot and tightened validation all still apply and are all unconditional,
 * so the forms are far from unprotected in the meantime — but this is the piece
 * that stops a determined bot, and it is inert until configured. The startup
 * warning below is the reminder.
 *
 * ## Network failures fail closed
 *
 * Once Turnstile *is* configured, an unreachable Cloudflare rejects the
 * submission. That is the opposite of the rate limiter's choice, and
 * deliberately so: a caller who cannot prove they are human should not be
 * waved through because the check was unavailable, or a bot could simply
 * attack while Cloudflare is having a bad day.
 */
export async function verifyTurnstileToken(token: unknown): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn(
      "TURNSTILE_SECRET_KEY is not set — captcha verification is being skipped. " +
        "Public forms are protected only by rate limiting, form tokens and validation."
    );
    return { ok: true };
  }

  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: "missing or malformed token" };
  }

  // Binding the token to the caller's address is what stops a token solved on
  // one machine being handed to a fleet of others.
  const ip = await clientIp();

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // This is an authorization decision; a cached answer is a replayed one.
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, reason: `siteverify returned ${response.status}` };
    }

    const result = (await response.json()) as SiteVerifyResponse;
    if (!result.success) {
      return { ok: false, reason: result["error-codes"]?.join(", ") || "verification failed" };
    }

    return { ok: true };
  } catch (error) {
    // Covers the timeout above and any network failure. See the note on failing
    // closed: configured-but-unreachable rejects.
    console.error("Turnstile verification error:", error);
    return { ok: false, reason: "verification unavailable" };
  }
}
