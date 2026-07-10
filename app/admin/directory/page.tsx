import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listTalentAccounts } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { VerifyToggle } from "@/components/admin/verify-toggle";

const navLink = "text-sm font-semibold text-gray-600 hover:text-black";

export default async function AdminDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const all = await listTalentAccounts();
  const rows = query
    ? all.filter((a) =>
        `${a.name} ${a.email} ${a.role ?? ""} ${a.skills ?? ""}`.toLowerCase().includes(query)
      )
    : all;

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Talent Directory</h1>
            <p className="text-gray-600">Verify talent accounts to list them in the employer directory.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className={navLink}>← Pipeline</Link>
            <Link href="/admin/interests" className={navLink}>Interests →</Link>
          </div>
        </div>

        <form method="get" action="/admin/directory" className="mb-4 flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, role, skills…"
            className="w-72 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button type="submit" className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-black/85">Search</button>
          {q && <Link href="/admin/directory" className="text-sm text-gray-500 hover:text-black">Clear</Link>}
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Skills</th>
                  <th className="px-6 py-3">Listed</th>
                  <th className="px-6 py-3 text-right">Verify</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      {query ? "No talent matches your search." : "No talent accounts yet."}
                    </td>
                  </tr>
                )}
                {rows.map((a) => (
                  <tr key={a.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                    <td className="px-6 py-4 text-gray-600">{a.email}</td>
                    <td className="px-6 py-4 text-gray-600">{a.role ?? "-"}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[240px]">{a.skills ?? "-"}</td>
                    <td className="px-6 py-4">
                      {a.verified ? <Badge variant="success">Listed</Badge> : <Badge variant="default">Not listed</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VerifyToggle userId={a.userId} initial={a.verified} />
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
