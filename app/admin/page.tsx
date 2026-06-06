import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock Data
const talentData = [
  { id: 1, name: "Alice Johnson", role: "Virtual Assistant", country: "Philippines", status: "Applicant", followUp: "2023-11-01", notes: "Strong English skills" },
  { id: 2, name: "Bob Smith", role: "Content Writer", country: "South Africa", status: "Screened", followUp: "2023-11-05", notes: "Portfolio looks great" },
  { id: 3, name: "Carla Davis", role: "Project Manager", country: "USA", status: "Verified", followUp: "-", notes: "Ready for placement" },
];

const employerData = [
  { id: 1, company: "TechStart Inc", contact: "Sarah J.", role: "Virtual Assistant", budget: "$1000 - $2000", status: "New Inquiry", followUp: "2023-10-28" },
  { id: 2, company: "Growth Labs", contact: "Mike T.", role: "Social Media Manager", budget: "$2000+", status: "In Progress", followUp: "2023-10-30" },
];

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session.user?.name}</p>
          </div>
          <Button variant="outline">Export Data CSV</Button>
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
                {talentData.map((talent) => (
                  <tr key={talent.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{talent.name}</td>
                    <td className="px-6 py-4 text-gray-600">{talent.role}</td>
                    <td className="px-6 py-4 text-gray-600">{talent.country}</td>
                    <td className="px-6 py-4">
                      <Badge variant={talent.status === 'Verified' ? 'success' : 'default'}>{talent.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{talent.followUp}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{talent.notes}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gold font-medium hover:underline">Update</button>
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
                {employerData.map((employer) => (
                  <tr key={employer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{employer.company}</td>
                    <td className="px-6 py-4 text-gray-600">{employer.contact}</td>
                    <td className="px-6 py-4 text-gray-600">{employer.role}</td>
                    <td className="px-6 py-4 text-gray-600">{employer.budget}</td>
                    <td className="px-6 py-4">
                      <Badge variant={employer.status === 'New Inquiry' ? 'warning' : 'navy'}>{employer.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{employer.followUp}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gold font-medium hover:underline">Update</button>
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
