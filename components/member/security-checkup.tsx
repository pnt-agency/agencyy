"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, AlertCircle, Info, KeyRound } from "lucide-react";
import { startTwoStepSetup, confirmTwoStepSetup, turnOffTwoStep } from "@/app/security-actions";
import { PasswordInput } from "@/components/ui/password-input";
import { TWO_STEP_CODE_LENGTH } from "@/lib/two-step-shared";

/**
 * Security Checkup: one place that says how well protected the account is and
 * offers the fix for anything that isn't. The Privacy Policy names this
 * feature, along with the passcode (two-step verification) it manages.
 */

export type SecuritySummary = {
  email: string;
  emailVerified: boolean;
  /** False for Google-only accounts, which have no password to add a step to. */
  hasPassword: boolean;
  /** Human-readable date two-step was turned on, or null when it's off. */
  twoStepEnabledSince: string | null;
};

type Status = "ok" | "action" | "info";

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-label="Done" />;
  if (status === "action") return <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" aria-label="Recommended" />;
  return <Info className="w-5 h-5 text-gray-400 shrink-0" aria-label="Information" />;
}

function CheckRow({
  status,
  title,
  children,
}: {
  status: Status;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 py-5 first:pt-0 last:pb-0">
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black">{title}</p>
        <div className="mt-1 text-sm text-gray-500">{children}</div>
      </div>
    </li>
  );
}

const buttonPrimary =
  "px-4 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-black/85 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer";
const buttonSecondary =
  "px-4 py-2.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer";
const inlineLink = "font-semibold text-black underline hover:no-underline";

function TwoStepControls({ summary }: { summary: SecuritySummary }) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "code-sent" | "confirm-off">("idle");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setStage("idle");
    setCode("");
    setPassword("");
    setError(null);
  };

  const sendCode = () => {
    setError(null);
    startTransition(async () => {
      const result = await startTwoStepSetup();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStage("code-sent");
      setNotice(`We emailed a ${TWO_STEP_CODE_LENGTH}-digit code to ${summary.email}.`);
    });
  };

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await confirmTwoStepSetup({ code });
      if (!result.success) {
        setError(result.error);
        return;
      }
      reset();
      setNotice(null);
      router.refresh();
    });
  };

  const turnOff = () => {
    setError(null);
    startTransition(async () => {
      const result = await turnOffTwoStep({ password });
      if (!result.success) {
        setError(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  const errorLine = error && (
    <p role="alert" className="mt-3 text-sm font-medium text-red-600">
      {error}
    </p>
  );

  if (summary.twoStepEnabledSince) {
    return (
      <>
        <p>
          On since {summary.twoStepEnabledSince}. Signing in with your password also needs a code we email to you.
        </p>
        {stage === "confirm-off" ? (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label htmlFor="two-step-password" className="block text-sm font-semibold text-black mb-2">
              Enter your password to turn two-step verification off
            </label>
            <PasswordInput
              id="two-step-password"
              tone="light"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errorLine}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={turnOff} disabled={pending || !password} className={buttonPrimary}>
                {pending ? "Turning off..." : "Turn off"}
              </button>
              <button onClick={reset} disabled={pending} className={buttonSecondary}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setStage("confirm-off")} className={`mt-3 ${buttonSecondary}`}>
            Turn off
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <p>
        Add a second step to password sign-ins: after your password, we email you a {TWO_STEP_CODE_LENGTH}-digit
        code. Someone who learns your password still can&apos;t get in without your inbox.
      </p>
      {stage === "code-sent" ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          {notice && <p className="mb-3 text-sm text-gray-700">{notice}</p>}
          <label htmlFor="two-step-code" className="block text-sm font-semibold text-black mb-2">
            Enter the code to turn it on
          </label>
          <input
            id="two-step-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={TWO_STEP_CODE_LENGTH + 2}
            placeholder="123456"
            className="w-40 px-4 py-3 rounded-xl border border-gray-200 bg-white text-black text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-black"
          />
          {errorLine}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={confirm} disabled={pending || !code} className={buttonPrimary}>
              {pending ? "Checking..." : "Turn on"}
            </button>
            <button onClick={sendCode} disabled={pending} className={buttonSecondary}>
              Send a new code
            </button>
            <button onClick={reset} disabled={pending} className={buttonSecondary}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {errorLine}
          <button onClick={sendCode} disabled={pending} className={`mt-3 ${buttonPrimary}`}>
            {pending ? "Sending code..." : "Turn on two-step verification"}
          </button>
        </>
      )}
    </>
  );
}

export function SecurityCheckup({ summary }: { summary: SecuritySummary }) {
  // Only what this site can actually check counts towards the score. A Google
  // account's own 2-Step Verification is invisible from here, so it's shown as
  // guidance rather than marked done or missing.
  const twoStepApplies = summary.hasPassword;
  const checks = [summary.emailVerified, ...(twoStepApplies ? [Boolean(summary.twoStepEnabledSince)] : [])];
  const remaining = checks.filter((done) => !done).length;

  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="scroll-mt-28 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6 animate-fade-up"
    >
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-black" />
        <h2 id="security-heading" className="text-lg font-bold text-black">
          Security Checkup
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {remaining === 0
          ? "Your account has every protection we offer turned on."
          : `${remaining} recommendation${remaining === 1 ? "" : "s"} to better protect your account.`}
      </p>

      <ul className="divide-y divide-gray-100">
        <CheckRow status={summary.emailVerified ? "ok" : "action"} title="Email address verified">
          {summary.emailVerified ? (
            <p>Your email is confirmed, so account and security messages reach you.</p>
          ) : (
            <p>
              Confirm your email so security messages and sign-in codes can reach you.{" "}
              <Link href="/verify-email" className={inlineLink}>
                Verify it now
              </Link>
            </p>
          )}
        </CheckRow>

        {summary.hasPassword ? (
          <CheckRow status="ok" title="Password">
            <p>
              Your account has a password. To change it, request a reset link from the{" "}
              <Link href="/forgot-password" className={inlineLink}>
                password reset page
              </Link>
              . We&apos;ll email you whenever it changes.
            </p>
          </CheckRow>
        ) : (
          <CheckRow status="ok" title="Signing in with Google">
            <p>You sign in with your Google account, so there&apos;s no separate password here to protect.</p>
          </CheckRow>
        )}

        {twoStepApplies ? (
          <CheckRow
            status={summary.twoStepEnabledSince ? "ok" : summary.emailVerified ? "action" : "info"}
            title="Two-step verification (passcode)"
          >
            {summary.emailVerified ? (
              <TwoStepControls summary={summary} />
            ) : (
              <p>Available once your email is verified — that&apos;s where your codes are sent.</p>
            )}
          </CheckRow>
        ) : (
          <CheckRow status="info" title="Two-step verification">
            <p>
              Because you sign in with Google, a second step is managed by Google.{" "}
              <a
                href="https://myaccount.google.com/signinoptions/two-step-verification"
                target="_blank"
                rel="noopener noreferrer"
                className={inlineLink}
              >
                Turn on 2-Step Verification in your Google Account
              </a>
            </p>
          </CheckRow>
        )}
      </ul>

      <p className="mt-6 flex items-start gap-2 text-xs text-gray-400">
        <KeyRound className="w-4 h-4 shrink-0" />
        We email you whenever your password or two-step settings change. If you get one of those emails and it
        wasn&apos;t you, reset your password straight away.
      </p>
    </section>
  );
}
