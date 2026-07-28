"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { resendVerificationEmail } from "@/app/auth-actions";

/**
 * Shown to a signed-in member who hasn't clicked their verification link yet.
 * Reached by landing on /verify-email without a token — either straight after
 * signup, or by being bounced out of /profile-setup.
 */
export function VerifyEmailPending({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [isResending, startResend] = useTransition();

  const handleResend = () => {
    startResend(async () => {
      const result = await resendVerificationEmail();
      setState(result.success ? "sent" : "error");
    });
  };

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <MailCheck className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-display font-black text-black mb-2">Verify your email</h1>
      <p className="text-gray-500 text-sm mb-2">
        We sent a verification link to{" "}
        <span className="font-semibold text-gray-700 break-all">{email}</span>.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Click it to unlock your profile. The link is good for 24 hours — check your spam folder if
        it hasn&apos;t arrived.
      </p>

      {state === "sent" ? (
        <p className="text-sm font-semibold text-green-600 mb-6">
          Sent — a fresh link is on its way.
        </p>
      ) : (
        <button
          onClick={handleResend}
          disabled={isResending}
          className="w-full py-3.5 bg-gold text-black font-bold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-wait mb-6 cursor-pointer"
        >
          {isResending
            ? "Sending..."
            : state === "error"
            ? "Couldn't send — try again"
            : "Resend verification email"}
        </button>
      )}

      <Link href="/dashboard" className="text-sm font-semibold text-black hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
