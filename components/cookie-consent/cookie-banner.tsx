"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import {
  ALL_ACCEPTED,
  ALL_REJECTED,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  parseConsent,
  readConsentCookie,
  serializeConsent,
  type ConsentChoices,
  type CookieConsent,
  type OptionalCategory,
} from "@/lib/cookie-consent";

/**
 * The cookie consent banner the Cookie Policy promises (section 3.1), and the
 * preferences panel the footer's "Privacy & Cookie Settings" reopens (3.2).
 *
 * Shown to every visitor until they choose. The policy commits to asking
 * visitors from the EU, UK and Nigeria; asking everyone satisfies that without
 * a geolocation lookup deciding who has rights.
 */

const CHANGE_EVENT = "amaris:cookie-consent-change";
const OPEN_EVENT = "amaris:open-cookie-settings";

/** Opens the preferences panel from anywhere, e.g. the footer link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

// The raw cookie string is the snapshot: a primitive, so React can compare it
// cheaply and the parsed object is only rebuilt when the cookie changes.
const getSnapshot = () => readConsentCookie(document.cookie) ?? "";
// Undecided on the server. Nothing renders until the browser has looked, so
// there's no flash of a banner for someone who already chose.
const getServerSnapshot = () => null;

/**
 * The visitor's current choice (null until they make one, and during server
 * rendering). Anything that loads a non-essential cookie should check this
 * first — see lib/cookie-consent.ts.
 */
export function useCookieConsent(): CookieConsent | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return raw ? parseConsent(raw) : null;
}

function saveConsent(choices: ConsentChoices) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${serializeConsent(choices)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Descriptions follow the Cookie Policy's own wording for each category.
const CATEGORIES: { key: OptionalCategory | "essential"; title: string; description: string }[] = [
  {
    key: "essential",
    title: "Essential",
    description: "Needed for signing in, keeping your session and protecting the site. Always on.",
  },
  {
    key: "analytics",
    title: "Performance & analytics",
    description: "Help us understand how visitors use the site — traffic, popular pages and loading times.",
  },
  {
    key: "functional",
    title: "Functional & preferences",
    description: "Remember choices such as language, regional layout or dashboard view.",
  },
  {
    key: "advertising",
    title: "Targeting & advertising",
    description: "Let advertising partners show you relevant recruitment ads on other websites.",
  },
];

export function CookieBanner() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const consent = raw ? parseConsent(raw) : null;
  const [reopened, setReopened] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>(ALL_REJECTED);
  const panelRef = useRef<HTMLDivElement>(null);

  const startCustomizing = useCallback((from: CookieConsent | null) => {
    setDraft(
      from ? { analytics: from.analytics, functional: from.functional, advertising: from.advertising } : ALL_REJECTED
    );
    setCustomizing(true);
  }, []);

  // The footer link reopens straight into the detailed view, seeded with the
  // current choices — that's what someone clicking "settings" wants to see.
  useEffect(() => {
    const open = () => {
      setReopened(true);
      startCustomizing(parseConsent(readConsentCookie(document.cookie)));
      requestAnimationFrame(() => panelRef.current?.focus());
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [startCustomizing]);

  // Server render, or the browser hasn't looked yet.
  if (raw === null) return null;
  if (consent && !reopened) return null;

  const finish = (choices: ConsentChoices) => {
    saveConsent(choices);
    setReopened(false);
    setCustomizing(false);
  };

  const close = () => {
    setReopened(false);
    setCustomizing(false);
  };

  const buttonBase = "px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer";
  // Equal visual weight for accept and reject: a consent banner that makes one
  // answer easier to find than the other isn't really asking.
  const choiceButton = `${buttonBase} bg-black text-white hover:bg-black/85`;
  const quietButton = `${buttonBase} border border-gray-200 bg-white text-black hover:bg-gray-50`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6 pointer-events-none">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-banner-title"
        tabIndex={-1}
        className="pointer-events-auto mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 w-5 h-5 shrink-0 text-black" aria-hidden="true" />
          <div className="flex-1">
            <h2 id="cookie-banner-title" className="font-bold text-black">
              {customizing ? "Privacy & Cookie Settings" : "Your cookie choices"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              We use essential cookies to keep you signed in and the site secure. With your consent we&apos;d also use
              analytics, preference and advertising cookies. You can change this any time from{" "}
              <span className="font-semibold">Privacy &amp; Cookie Settings</span> at the bottom of every page. See our{" "}
              <Link href="/privacy#cookie-policy" className="font-semibold text-black underline hover:no-underline">
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {customizing && (
          <fieldset className="mt-5 space-y-3">
            <legend className="sr-only">Cookie categories</legend>
            {CATEGORIES.map(({ key, title, description }) => {
              const essential = key === "essential";
              const checked = essential ? true : draft[key];
              return (
                <label
                  key={key}
                  className={`flex items-start gap-3 rounded-2xl border border-gray-100 p-4 ${
                    essential ? "bg-gray-50" : "cursor-pointer hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-black"
                    checked={checked}
                    disabled={essential}
                    onChange={(e) => {
                      if (!essential) setDraft((current) => ({ ...current, [key]: e.target.checked }));
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-black">
                      {title}
                      {essential && <span className="ml-2 text-xs font-medium text-gray-400">Always on</span>}
                    </span>
                    <span className="block text-sm text-gray-500">{description}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {customizing ? (
            <>
              {consent && (
                <button type="button" onClick={close} className={quietButton}>
                  Cancel
                </button>
              )}
              <button type="button" onClick={() => finish(draft)} className={quietButton}>
                Save choices
              </button>
              <button type="button" onClick={() => finish(ALL_REJECTED)} className={choiceButton}>
                Reject non-essential
              </button>
              <button type="button" onClick={() => finish(ALL_ACCEPTED)} className={choiceButton}>
                Accept all
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => startCustomizing(consent)} className={quietButton}>
                Customize
              </button>
              <button type="button" onClick={() => finish(ALL_REJECTED)} className={choiceButton}>
                Reject non-essential
              </button>
              <button type="button" onClick={() => finish(ALL_ACCEPTED)} className={choiceButton}>
                Accept all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

