import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount, isEmailVerified } from "@/lib/auth";
import { getTalentKyc, getTalentProfile } from "@/lib/db/queries";
import { KycForm } from "@/components/member/kyc-form";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { maskIdNumber, formatKycDate } from "@/lib/kyc";

export const metadata = {
  title: "Identity verification | Amaris Partners",
};

export default async function KycPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/");
  if (account.role === "employer") redirect("/dashboard");
  if (account.role === "admin") redirect("/admin/kyc");
  // A fresh Google sign-up hasn't picked talent or employer yet.
  if (account.role === "user") redirect("/profile-setup");
  if (!isEmailVerified(account)) redirect("/verify-email");

  const [submission, profile] = await Promise.all([
    getTalentKyc(account.id),
    getTalentProfile(account.id),
  ]);

  const status = submission?.status ?? null;
  const showForm = !submission || status === "Rejected";

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-4xl font-display font-black text-black">Identity verification</h1>
            {status === "Approved" && (
              <Badge variant="success">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ID verified
                </span>
              </Badge>
            )}
          </div>
          <p className="text-gray-500">
            One-time check that you are who you say you are. It adds an ID verified badge to your
            profile and is never shown to employers in raw form.
          </p>
        </div>

        {submission && status === "Approved" && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-900">Your identity is verified</h2>
                <p className="text-sm text-green-800 mt-1">
                  {submission.idType} ending {maskIdNumber(submission.idNumber)} · approved{" "}
                  {formatKycDate(submission.reviewedAt)}
                </p>
                <p className="text-sm text-green-700 mt-3">
                  Nothing else is needed. If your legal name changes, contact support so we can
                  re-check it.
                </p>
              </div>
            </div>
          </div>
        )}

        {submission && status === "Pending" && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-900">Under review</h2>
                <p className="text-sm text-amber-800 mt-1">
                  Submitted {formatKycDate(submission.submittedAt)} · usually reviewed within two
                  business days.
                </p>
                <p className="text-sm text-amber-700 mt-3">
                  We&apos;ll notify you in the app when it&apos;s done. You can&apos;t edit a submission
                  while it&apos;s in the queue.
                </p>
              </div>
            </div>
          </div>
        )}

        {submission && status === "Rejected" && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 md:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900">We need another look</h2>
                <p className="text-sm text-red-800 mt-1">
                  Reviewed {formatKycDate(submission.reviewedAt)}.
                </p>
                {submission.reviewNote && (
                  <p className="text-sm text-red-900 mt-3 font-medium">{submission.reviewNote}</p>
                )}
                <p className="text-sm text-red-700 mt-3">
                  Resubmit below with the fix in place — there&apos;s no limit on attempts.
                </p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <KycForm
            initial={{
              legalName: submission?.legalName ?? account.name,
              dateOfBirth: submission?.dateOfBirth ?? "",
              country: submission?.country ?? profile?.country ?? "",
              idType: submission?.idType ?? "",
              idNumber: submission?.idNumber ?? "",
            }}
          />
        )}

        {!submission && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "About 2 minutes", body: "Details and two photos." },
              { title: "Private by default", body: "Only the review team sees your documents." },
              { title: "One badge", body: "Employers see “ID verified”, nothing more." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-5">
                <p className="text-sm font-bold text-black">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
