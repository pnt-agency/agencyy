"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/app/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await requestPasswordReset({ email });
      // Always show the same confirmation — we never reveal whether the email exists.
      setSent(true);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-display font-black text-black mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-8">
              If an account exists for <span className="font-semibold text-gray-700">{email}</span>, we&apos;ve sent a link to reset your password. The link expires in 1 hour.
            </p>
            <Link href="/" className="text-sm font-semibold text-black hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-black text-black mb-2">Forgot your password?</h1>
              <p className="text-gray-500 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {isPending ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-black inline-flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
