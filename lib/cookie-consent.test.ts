import { describe, it, expect } from "vitest";
import {
  ALL_ACCEPTED,
  ALL_REJECTED,
  CONSENT_COOKIE,
  CONSENT_VERSION,
  hasConsent,
  parseConsent,
  readConsentCookie,
  serializeConsent,
} from "./cookie-consent";

describe("cookie consent storage", () => {
  it("round-trips a choice", () => {
    const at = new Date("2026-11-06T10:00:00Z");
    const parsed = parseConsent(serializeConsent({ analytics: true, functional: false, advertising: false }, at));
    expect(parsed).toEqual({
      v: CONSENT_VERSION,
      at: at.toISOString(),
      analytics: true,
      functional: false,
      advertising: false,
    });
  });

  it("treats missing, garbled or tampered values as no choice, so the banner asks again", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent("not-json")).toBeNull();
    expect(parseConsent("%E0%A4%A")).toBeNull(); // malformed URI escape
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION, at: "x" })))).toBeNull();
    expect(
      parseConsent(
        encodeURIComponent(
          JSON.stringify({ v: CONSENT_VERSION, at: "x", analytics: "yes", functional: false, advertising: false })
        )
      )
    ).toBeNull();
  });

  it("asks again when the categories have changed since the choice was made", () => {
    const old = encodeURIComponent(
      JSON.stringify({ v: CONSENT_VERSION - 1, at: "x", analytics: true, functional: true, advertising: true })
    );
    expect(parseConsent(old)).toBeNull();
  });

  it("finds its cookie among others", () => {
    const value = serializeConsent(ALL_REJECTED);
    const header = `next-auth.csrf-token=abc; ${CONSENT_COOKIE}=${value}; other=1`;
    expect(readConsentCookie(header)).toBe(value);
    expect(readConsentCookie("a=1; b=2")).toBeNull();
    expect(readConsentCookie("")).toBeNull();
  });
});

describe("hasConsent", () => {
  it("always allows essential cookies, even before any choice", () => {
    expect(hasConsent(null, "essential")).toBe(true);
  });

  it("allows nothing optional before a choice", () => {
    expect(hasConsent(null, "analytics")).toBe(false);
    expect(hasConsent(null, "advertising")).toBe(false);
  });

  it("follows the stored choice per category", () => {
    const some = parseConsent(serializeConsent({ analytics: true, functional: false, advertising: false }));
    expect(hasConsent(some, "analytics")).toBe(true);
    expect(hasConsent(some, "functional")).toBe(false);
    const all = parseConsent(serializeConsent(ALL_ACCEPTED));
    expect(hasConsent(all, "advertising")).toBe(true);
  });
});
