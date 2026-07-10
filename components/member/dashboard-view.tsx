"use client";

import { useState, useTransition } from "react";
import { Briefcase, FileText, Calendar, ChevronRight, CheckCircle2, TrendingUp, MailWarning, ShieldCheck, Clock, Users } from "lucide-react";
import Link from "next/link";
import { resendVerificationEmail } from "@/app/auth-actions";

type DashboardViewProps = {
  name: string;
  role: string;
  email: string;
  memberSince: string;
  profileCompleteness: number;
  leadCount: number;
  emailVerified: boolean;
  listed?: boolean;
  interestCount?: number;
};

export function DashboardView({
  name,
  role,
  email,
  memberSince,
  profileCompleteness,
  leadCount,
  emailVerified,
  listed = false,
  interestCount = 0,
}: DashboardViewProps) {
  const isTalent = role !== "employer";

  const [resendState, setResendState] = useState<"idle" | "sent" | "error">("idle");
  const [isResending, startResend] = useTransition();

  const handleResend = () => {
    startResend(async () => {
      const result = await resendVerificationEmail();
      setResendState(result.success ? "sent" : "error");
    });
  };

  // Real, actionable next steps derived from the account's actual state — no
  // fabricated activity feed.
  const nextSteps: { label: string; href: string }[] = [];
  if (profileCompleteness < 100) {
    nextSteps.push({ label: `Complete your profile — ${profileCompleteness}% done`, href: "/profile-setup" });
  }
  if (isTalent) {
    nextSteps.push({ label: "Continue your verification training", href: "/training" });
    if (leadCount === 0) {
      nextSteps.push({ label: "Submit your talent application", href: "/apply" });
    }
  } else {
    nextSteps.push({ label: "Browse verified talent", href: "/talent" });
    nextSteps.push({ label: "Post a role to hire talent", href: "/hire" });
  }

  const leadLabel = isTalent ? "Applications Submitted" : "Inquiries Submitted";

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Email verification notice — soft (informational, not blocking) */}
        {!emailVerified && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <MailWarning className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900">
                Please verify your email address. We sent a link to <span className="font-semibold">{email}</span>.
              </p>
            </div>
            {resendState === "sent" ? (
              <span className="text-sm font-semibold text-amber-700 shrink-0">Verification email sent ✓</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-sm font-semibold text-amber-900 underline hover:no-underline disabled:opacity-50 shrink-0"
              >
                {isResending ? "Sending..." : resendState === "error" ? "Failed — try again" : "Resend email"}
              </button>
            )}
          </div>
        )}

        {/* Talent: directory listing status */}
        {isTalent && (
          listed ? (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-900">Your profile is <span className="font-semibold">live in the talent directory</span> — employers can discover you.</p>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <Clock className="w-5 h-5 text-gray-500 shrink-0" />
              <p className="text-sm text-gray-700">Your profile is <span className="font-semibold">pending review</span>. Our team verifies profiles before listing them in the directory.</p>
            </div>
          )
        )}

        {/* Talent: interest received (read-only — connections are admin-mediated) */}
        {isTalent && interestCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
            <Users className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-900">
              <span className="font-semibold">{interestCount} employer{interestCount === 1 ? "" : "s"}</span> {interestCount === 1 ? "has" : "have"} expressed interest in you — our team will reach out to make the introduction.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="animate-fade-up">
            <p className="text-gray-500 font-medium mb-1">Welcome back,</p>
            <h1 className="text-4xl font-display font-black text-black">
              {name}
            </h1>
          </div>
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <Link href={isTalent ? "/profile-setup" : "/hire"}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-black/90 transition-colors shadow-md">
                {isTalent ? "Update Profile" : "Post a Job"}
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Row — all real, account-derived */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-500 font-medium text-sm">Profile Completeness</p>
            <h3 className="text-2xl font-bold text-black mt-1">{profileCompleteness}%</h3>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-black rounded-full transition-all" style={{ width: `${profileCompleteness}%` }} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                {isTalent ? <FileText className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
              </div>
            </div>
            <p className="text-gray-500 font-medium text-sm">{leadLabel}</p>
            <h3 className="text-2xl font-bold text-black mt-1">{leadCount}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: "250ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-500 font-medium text-sm">Member Since</p>
            <h3 className="text-2xl font-bold text-black mt-1">{memberSince}</h3>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column — real next steps */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
              <h2 className="text-xl font-bold text-black mb-6">Next Steps</h2>

              {nextSteps.length > 0 ? (
                <div className="space-y-3">
                  {nextSteps.map((step) => (
                    <Link
                      key={step.href + step.label}
                      href={step.href}
                      className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-black">{step.label}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-gray-600 font-medium">You&apos;re all set.</p>
                  <p className="text-gray-400 text-sm mt-1">Your profile is complete. We&apos;ll be in touch about matches.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — real account summary + links */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-fade-up" style={{ animationDelay: "350ms" }}>
              <h3 className="text-lg font-bold text-black mb-5">Account</h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-400 font-medium">Account type</dt>
                  <dd className="text-black font-semibold capitalize mt-0.5">{isTalent ? "Talent" : "Employer"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium">Email</dt>
                  <dd className="text-black font-semibold mt-0.5 break-all">{email}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium">Member since</dt>
                  <dd className="text-black font-semibold mt-0.5">{memberSince}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-fade-up" style={{ animationDelay: "400ms" }}>
              <h3 className="text-lg font-bold text-black mb-4">Quick Links</h3>
              <div className="space-y-2">
                {(isTalent
                  ? [
                      { label: "My Profile", href: "/profile-setup" },
                      { label: "Training Hub", href: "/training" },
                    ]
                  : [
                      { label: "My Profile", href: "/profile-setup" },
                      { label: "Browse Talent", href: "/talent" },
                      { label: "Post a Job", href: "/hire" },
                    ]
                ).map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <span className="font-medium text-gray-700 group-hover:text-black">{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
