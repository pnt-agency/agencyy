/**
 * The visitor's cookie choices, as the Cookie Policy (/privacy#cookie-policy)
 * describes them: essential cookies always, and three optional categories only
 * with consent.
 *
 * Stored in a first-party cookie so the server could read it too, should a
 * server-rendered script ever need gating. Pure functions only — safe to import
 * from client and server alike.
 *
 * ## Using it
 *
 * Nothing on the site sets non-essential cookies today: the only cookies are
 * the sign-in session and its CSRF token, which are essential. Anything added
 * later that falls in an optional category — analytics, a chat widget that
 * remembers preferences, an ad pixel — must not load until `hasConsent()` says
 * so. The banner component exposes that as `useCookieConsent()`.
 */

export const CONSENT_COOKIE = "amaris_cookie_consent";

/**
 * Bump when the categories or what they mean change. A stored choice with an
 * older version is treated as no choice, so everyone is asked again — consent
 * to the old categories isn't consent to the new ones.
 */
export const CONSENT_VERSION = 1;

/** Re-ask after six months, a common reading of how long consent stays valid. */
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export const OPTIONAL_CATEGORIES = ["analytics", "functional", "advertising"] as const;
export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number];

export type ConsentChoices = Record<OptionalCategory, boolean>;

export type CookieConsent = ConsentChoices & {
  v: number;
  /** ISO timestamp of when the choice was made. */
  at: string;
};

export const ALL_ACCEPTED: ConsentChoices = { analytics: true, functional: true, advertising: true };
export const ALL_REJECTED: ConsentChoices = { analytics: false, functional: false, advertising: false };

/** Serialized cookie value for a set of choices. */
export function serializeConsent(choices: ConsentChoices, now: Date = new Date()): string {
  const value: CookieConsent = {
    v: CONSENT_VERSION,
    at: now.toISOString(),
    analytics: choices.analytics,
    functional: choices.functional,
    advertising: choices.advertising,
  };
  return encodeURIComponent(JSON.stringify(value));
}

/**
 * The stored choice, or null when there isn't a valid current one — missing,
 * tampered with, or from an older version of the categories. Null means "ask".
 */
export function parseConsent(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const record = data as Record<string, unknown>;
  if (record.v !== CONSENT_VERSION || typeof record.at !== "string") return null;
  if (!OPTIONAL_CATEGORIES.every((category) => typeof record[category] === "boolean")) return null;
  return {
    v: CONSENT_VERSION,
    at: record.at,
    analytics: record.analytics as boolean,
    functional: record.functional as boolean,
    advertising: record.advertising as boolean,
  };
}

/** Whether a category may be used. Essential cookies never need asking. */
export function hasConsent(consent: CookieConsent | null, category: OptionalCategory | "essential"): boolean {
  if (category === "essential") return true;
  return consent?.[category] === true;
}

/** Finds our cookie's raw value in a `document.cookie`-style header string. */
export function readConsentCookie(cookieHeader: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CONSENT_COOKIE) return rest.join("=");
  }
  return null;
}
