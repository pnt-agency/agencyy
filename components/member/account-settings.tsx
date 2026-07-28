"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, ShieldAlert, MailWarning, Trash2 } from "lucide-react";
import { deleteMyAccount } from "@/app/auth-actions";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validation";

export type AccountSummary = {
  name: string;
  email: string;
  accountType: string;
  memberSince: string;
  emailVerified: boolean;
};

export function AccountSettings({ account }: { account: AccountSummary }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setIsSigningOut(true);
    signOut({ callbackUrl: "/" });
  };

  const handleDelete = () => {
    setError(null);
    startDelete(async () => {
      const result = await deleteMyAccount({ confirmation });
      if (!result.success) {
        setError(result.error);
        return;
      }
      // The account is gone server-side; drop the now-dead session cookie and
      // land them on the signed-out home page rather than a redirect bounce.
      signOut({ callbackUrl: "/" });
    });
  };

  const busy = isDeleting || isSigningOut;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-10 animate-fade-up">
          <h1 className="text-4xl font-display font-black text-black mb-2">Account settings</h1>
          <p className="text-gray-500">Manage your session and your account on Amaris Partners.</p>
        </div>

        {/* Account details */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6 animate-fade-up">
          <h2 className="text-lg font-bold text-black mb-5">Your details</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gray-400 font-medium">Name</dt>
              <dd className="text-black font-semibold mt-0.5">{account.name}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Email</dt>
              <dd className="text-black font-semibold mt-0.5 break-all">{account.email}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Account type</dt>
              <dd className="text-black font-semibold mt-0.5">{account.accountType}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Member since</dt>
              <dd className="text-black font-semibold mt-0.5">{account.memberSince}</dd>
            </div>
          </dl>

          {account.emailVerified ? (
            <Link
              href="/profile-setup"
              className="inline-block mt-6 text-sm font-semibold text-black hover:underline"
            >
              Edit your profile →
            </Link>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <MailWarning className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900">
                Your email isn&apos;t verified yet, so your profile stays locked.{" "}
                <Link href="/verify-email" className="font-semibold underline hover:no-underline">
                  Verify it now
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6 animate-fade-up">
          <h2 className="text-lg font-bold text-black mb-1">Sign out</h2>
          <p className="text-sm text-gray-500 mb-5">
            End this session on this device. Your account and profile are untouched.
          </p>
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="flex items-center gap-2 px-5 py-3 bg-black text-white font-bold rounded-xl hover:bg-black/85 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-3xl border-2 border-red-100 shadow-sm p-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-700">Danger zone</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Deleting your account signs you out, removes your profile from the talent directory and
            releases your email address. Applications and inquiries you already submitted stay with
            our team as their own records. This can&apos;t be undone from here — you&apos;d need to
            sign up again.
          </p>

          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-2 px-5 py-3 border-2 border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete my account
            </button>
          ) : (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
              <label htmlFor="confirmation" className="block text-sm font-bold text-red-900 mb-2">
                Type {DELETE_ACCOUNT_CONFIRMATION} to confirm
              </label>
              <input
                id="confirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                placeholder={DELETE_ACCOUNT_CONFIRMATION}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />

              {error && (
                <p role="alert" className="text-red-700 text-sm mt-3 font-medium">
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Permanently delete my account"}
                </button>
                <button
                  onClick={() => {
                    setConfirmingDelete(false);
                    setConfirmation("");
                    setError(null);
                  }}
                  disabled={busy}
                  className="flex-1 py-3 bg-white border border-gray-200 text-black font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
