"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/app/auth-actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const result = await resetPassword({ token, password });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-display font-black text-black mb-2">Invalid link</h1>
        <p className="text-gray-500 text-sm mb-8">This password reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="text-sm font-semibold text-black hover:underline">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-display font-black text-black mb-2">Password updated</h1>
        <p className="text-gray-500 text-sm mb-8">You can now sign in with your new password.</p>
        <button
          onClick={() => { router.push("/"); router.refresh(); }}
          className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-black/90 transition-all"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-black text-black mb-2">Set a new password</h1>
        <p className="text-gray-500 text-sm">Choose a password with at least 8 characters.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">New password</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm password</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
            />
          </div>
        </div>
        {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          {isPending ? "Updating..." : "Update password"}
        </button>
      </form>
    </>
  );
}
