"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmail } from "@/app/auth-actions";

type Status = "verifying" | "success" | "error";

export function VerifyEmailClient({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState("This verification link is missing or malformed.");
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true; // guard against double-invocation in dev strict mode
    verifyEmail(token).then((result) => {
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    });
  }, [token]);

  return (
    <div className="text-center">
      {status === "verifying" && (
        <>
          <div className="w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h1 className="text-2xl font-display font-black text-black mb-2">Verifying your email…</h1>
          <p className="text-gray-500 text-sm">Hang tight for a moment.</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-black text-black mb-2">Email verified</h1>
          <p className="text-gray-500 text-sm mb-8">Your email address is confirmed. Welcome aboard!</p>
          <Link href="/dashboard" className="inline-block w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-black/90 transition-all">
            Go to dashboard
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-black text-black mb-2">Verification failed</h1>
          <p className="text-gray-500 text-sm mb-8">{message}</p>
          <Link href="/dashboard" className="text-sm font-semibold text-black hover:underline">
            Go to dashboard to resend
          </Link>
        </>
      )}
    </div>
  );
}
