import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { listTalentRecords, listEmployerRecords } from "@/lib/db/queries";
import { TalentStatusUpdater } from "@/components/admin/talent-status-updater";
import { EmployerStatusUpdater } from "@/components/admin/employer-status-updater";
import { ExportDataButton } from "@/components/admin/export-data-button";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboard() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/");
  }

  const [talents, employers] = await Promise.all([
    listTalentRecords(),
    listEmployerRecords(),
  ]);

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session.user?.name}</p>
          </div>
          <ExportDataButton talents={talents} employers={employers} />
        </div>

        {/* Talent Tracker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-navy">Talent Pipeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Follow-up</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {talents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No talent applications yet.
                    </td>
                  </tr>
                )}
                {talents.map((talent) => (
                  <tr key={talent.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{talent.name}</td>
                    <td className="px-6 py-4 text-gray-600">{talent.role}</td>
                    <td className="px-6 py-4 text-gray-600">{talent.country}</td>
                    <td className="px-6 py-4">
                      <Badge variant={talent.status === "Verified" ? "success" : "default"}>
                        {talent.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(talent.followUpDate)}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">
                      {talent.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <TalentStatusUpdater id={talent.id} currentStatus={talent.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employer Tracker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-navy">Employer Inquiries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Role Needed</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Follow-up</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No employer inquiries yet.
                    </td>
                  </tr>
                )}
                {employers.map((employer) => (
                  <tr key={employer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{employer.companyName}</td>
                    <td className="px-6 py-4 text-gray-600">{employer.contactName}</td>
                    <td className="px-6 py-4 text-gray-600">{employer.roleNeeded}</td>
                    <td className="px-6 py-4 text-gray-600">{employer.budget}</td>
                    <td className="px-6 py-4">
                      <Badge variant={employer.status === "New Inquiry" ? "warning" : "navy"}>
                        {employer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(employer.followUpDate)}</td>
                    <td className="px-6 py-4 text-right">
                      <EmployerStatusUpdater id={employer.id} currentStatus={employer.status} />
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
