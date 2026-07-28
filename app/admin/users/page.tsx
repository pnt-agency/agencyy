import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listUserAccounts, countAdmins } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { RoleSelector } from "@/components/admin/role-selector";

const navLink = "text-sm font-semibold text-gray-600 hover:text-black";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const [all, adminCount] = await Promise.all([listUserAccounts(), countAdmins()]);
  const rows = query
    ? all.filter((a) => `${a.name} ${a.email} ${a.role}`.toLowerCase().includes(query))
    : all;

  return (
    <div className="flex-1 bg-gray-50 px-4 pt-28 pb-8 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-ink">User Accounts</h1>
            <p className="text-gray-600">
              Change what an account can do. Promoting to admin grants full access to this dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/admin" className={navLink}>← Pipeline</Link>
            <Link href="/admin/directory" className={navLink}>Directory</Link>
            <Link href="/admin/interests" className={navLink}>Interests →</Link>
          </div>
        </div>

        <form method="get" action="/admin/users" className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, role…"
            className="w-full sm:w-72 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button type="submit" className="rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-black hover:bg-gold/85">Search</button>
          {q && <Link href="/admin/users" className="text-sm text-gray-500 hover:text-black">Clear</Link>}
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Verified</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3 text-right">Role</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      {query ? "No accounts match your search." : "No accounts yet."}
                    </td>
                  </tr>
                )}
                {rows.map((a) => {
                  const isSelf = a.email === session.user?.email;
                  const isLastAdmin = a.role === "admin" && adminCount <= 1;
                  return (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {a.name}
                        {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{a.email}</td>
                      <td className="px-6 py-4">
                        {a.emailVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="default">Unverified</Badge>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RoleSelector
                          userId={a.id}
                          initial={a.role}
                          disabled={isSelf || isLastAdmin}
                          disabledReason={
                            isSelf
                              ? "You cannot change your own role."
                              : "This is the last admin account."
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
