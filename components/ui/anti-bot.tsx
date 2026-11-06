"use client";

import { useCallback, useEffect, useState } from "react";
import { issueFormTokenAction } from "@/app/anti-bot-actions";
import { TurnstileWidget, isTurnstileEnabled } from "./turnstile-widget";

/**
 * Client-side half of the anti-abuse checks on the public forms. The server
 * half — and the reasoning behind each layer — is in lib/anti-bot.ts.
 *
 * Nothing here is a security control on its own: every value this produces is
 * visible to, and forgeable by, anyone who reads the page source. Its job is to
 * carry the evidence the server needs, and to keep the two public forms wiring
 * it up the same way.
 */

/**
 * A text input positioned off-screen for humans and irresistible to bots that
 * fill every field they can find.
 *
 * Deliberately *not* `display: none` or `hidden` — the naive bots this catches
 * commonly skip fields that are hidden that way, and so do some password
 * managers, which would be worse. Off-screen positioning keeps it in the
 * layout and in the DOM while making it unreachable in practice: screen
 * readers skip it via aria-hidden and keyboards skip it via tabIndex.
 *
 * ## Autofill is the real false-positive risk
 *
 * `autoComplete="off"` does *not* keep browsers out. Chrome ignores it when
 * filling a saved address profile, and it classifies fields by matching their
 * name, id and label against keywords, and password managers do the same.
 * This field was originally called `company-website`, and a real person's
 * /hire submission was rejected as "honeypot filled" — almost certainly
 * autofill matching "company" or "website".
 *
 * So the name, id and label must contain nothing autofill recognises: no
 * company/organisation, name, email, phone, address, url/website, etc. The
 * cost is that it no longer looks tempting to a bot skimming field names, but
 * the bots this catches fill every field regardless.
 */
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor="form-ref">Leave this field empty</label>
      <input
        id="form-ref"
        // Deliberately meaningless to autofill — see the note above before
        // renaming this.
        name="form-ref"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export type AntiBotState = {
  /** Pass this to the submit action as its second argument. */
  fields: { honeypot: string; formToken: string | null; turnstileToken: string | null };
  honeypot: { value: string; onChange: (value: string) => void };
  /** Wire straight into <TurnstileWidget />. */
  turnstile: { onToken: (token: string | null) => void; resetSignal: number };
  /**
   * False until the form has everything the server will ask for. Forms use it
   * to disable submit, so a user isn't told "we couldn't verify that" for a
   * challenge that simply hadn't finished loading.
   */
  ready: boolean;
  /**
   * Call after a failed submission. Turnstile tokens are single-use, so without
   * this a second attempt always fails — the user would be stuck on a form that
   * refuses every retry.
   */
  reset: () => void;
};

export function useAntiBot(): AntiBotState {
  const [honeypot, setHoneypot] = useState("");
  const [formToken, setFormToken] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    issueFormTokenAction()
      .then((token) => {
        if (!cancelled) setFormToken(token);
      })
      .catch((error) => {
        // Leaves formToken null, so `ready` stays false and submit stays
        // disabled rather than sending a request the server will reject.
        console.error("Could not obtain a form token:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback(() => {
    setTurnstileToken(null);
    setResetSignal((n) => n + 1);
  }, []);

  return {
    fields: { honeypot, formToken, turnstileToken },
    honeypot: { value: honeypot, onChange: setHoneypot },
    turnstile: { onToken: setTurnstileToken, resetSignal },
    ready: Boolean(formToken) && (!isTurnstileEnabled() || Boolean(turnstileToken)),
    reset,
  };
}

export { TurnstileWidget, isTurnstileEnabled };
