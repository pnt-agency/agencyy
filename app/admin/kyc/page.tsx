import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listKycSubmissions, countPendingKyc } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { KycReviewControls } from "@/components/admin/kyc-review-controls";
import { KycDocumentButton } from "@/components/admin/kyc-document-button";
import { maskIdNumber, formatKycDate } from "@/lib/kyc";

const navLink = "text-sm font-semibold text-gray-600 hover:text-black";

function statusBadge(status: string) {
  if (status === "Approved") return <Badge variant="success">Approved</Badge>;
  if (status === "Rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export default async function AdminKycPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const [submissions, pending] = await Promise.all([listKycSubmissions(), countPendingKyc()]);

  return (
    <div className="flex-1 bg-gray-50 px-4 pt-28 pb-8 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-ink">Identity verification</h1>
            <p className="text-gray-600">
              {pending > 0
                ? `${pending} submission${pending === 1 ? "" : "s"} waiting for review.`
                : "No submissions waiting for review."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/admin" className={navLink}>← Pipeline</Link>
            <Link href="/admin/directory" className={navLink}>Directory</Link>
            <Link href="/admin/interests" className={navLink}>Interests</Link>
            <Link href="/admin/users" className={navLink}>Users</Link>
            <Link href="/admin/training" className={navLink}>Training</Link>
            <Link href="/admin/audit" className={navLink}>Audit Log →</Link>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Handle with care.</strong> These are identity documents. Only open them to verify a
          submission, and note that every view is written to the audit log.
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Talent</th>
                  <th className="px-6 py-3">Legal name</th>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Documents</th>
                  <th className="px-6 py-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                      No identity submissions yet.
                    </td>
                  </tr>
                )}
                {submissions.map((s) => (
                  <tr key={s.userId} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{s.legalName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{s.idType}</p>
                      <p className="text-xs text-gray-500 tabular-nums">{maskIdNumber(s.idNumber)}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{s.country}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {formatKycDate(s.submittedAt)}
                    </td>
                    <td className="px-6 py-4">
                      {statusBadge(s.status)}
                      {s.status === "Rejected" && s.reviewNote && (
                        <p className="mt-1 max-w-[220px] text-xs text-gray-500">{s.reviewNote}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <KycDocumentButton userId={s.userId} kind="id" filename={s.idDocumentFilename} />
                        <KycDocumentButton userId={s.userId} kind="selfie" filename={s.selfieFilename} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <KycReviewControls userId={s.userId} status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
