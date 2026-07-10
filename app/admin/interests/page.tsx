import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listInterests } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { InterestStatusUpdater } from "@/components/admin/interest-status-updater";

const navLink = "text-sm font-semibold text-gray-600 hover:text-black";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function statusVariant(status: string): "success" | "warning" | "navy" | "default" {
  if (status === "Intro Made") return "success";
  if (status === "Pending") return "warning";
  if (status === "Closed") return "default";
  return "navy";
}

export default async function AdminInterestsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const interests = await listInterests();

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Interest Requests</h1>
            <p className="text-gray-600">Employers who want an intro to a talent. Make the connection, then move the status.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className={navLink}>← Pipeline</Link>
            <Link href="/admin/directory" className={navLink}>Directory →</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Employer</th>
                  <th className="px-6 py-3">Talent</th>
                  <th className="px-6 py-3">Message</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No interest requests yet.
                    </td>
                  </tr>
                )}
                {interests.map((it) => (
                  <tr key={it.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{it.employerName}</div>
                      <div className="text-gray-500 text-xs">{it.employerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{it.talentName}</div>
                      <div className="text-gray-500 text-xs">{it.talentEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-[260px] truncate">{it.message || "-"}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(it.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant(it.status)}>{it.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <InterestStatusUpdater id={it.id} currentStatus={it.status} />
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
