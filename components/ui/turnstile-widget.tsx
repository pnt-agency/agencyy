"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the Cloudflare Turnstile widget and hands the resulting token up to
 * the form.
 *
 * When NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset this renders nothing and reports
 * a null token — matching the server, which skips verification when it has no
 * secret key. That keeps the forms working before the keys are configured; see
 * lib/turnstile.ts for why that tradeoff was made and what it costs.
 */

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  theme?: "light" | "dark" | "auto";
};

type TurnstileApi = {
  render: (element: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// One shared load across every mount — two forms on one page, or a remount,
// must not inject the script twice.
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later mount retry rather than caching the failure forever.
      scriptPromise = null;
      reject(new Error("Turnstile script failed"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function isTurnstileEnabled(): boolean {
  return Boolean(TURNSTILE_SITE_KEY);
}

type Props = {
  /**
   * Called with a token when the challenge passes, and with null when it
   * expires, errors, or is reset — so the form can disable submit until a
   * fresh token arrives.
   */
  onToken: (token: string | null) => void;
  /**
   * Bump this to force a new challenge. Turnstile tokens are single-use, so a
   * failed submission needs a reset before the user can retry.
   */
  resetSignal?: number;
};

export function TurnstileWidget({ onToken, resetSignal = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Held in a ref so the render effect below doesn't depend on the identity of
  // a callback the parent probably redefines every render.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      onTokenRef.current(null);
      return;
    }

    // Guards the async gap below: an unmount (or a StrictMode double-invoke)
    // between the script loading and the widget rendering must not leave an
    // orphaned widget behind.
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          "error-callback": () => onTokenRef.current(null),
          "expired-callback": () => onTokenRef.current(null),
          theme: "light",
        });
      })
      .catch(() => {
        // The script is blocked or unreachable. Report no token; the server
        // decides what that means (a rejection once Turnstile is configured).
        if (!cancelled) onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Skip the initial render — there is nothing to reset yet.
    if (resetSignal === 0) return;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, [resetSignal]);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
