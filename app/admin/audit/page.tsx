import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listAuditLogs } from "@/lib/db/queries";
import { AUDIT_ACTIONS } from "@/lib/audit";

const navLink = "text-sm font-semibold text-gray-600 hover:text-black";

const PAGE_SIZE = 50;

// Human wording for each logged action, so the table doesn't make an admin
// decode "profile.verified.set".
const ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.TALENT_STATUS_SET]: "Talent status changed",
  [AUDIT_ACTIONS.TALENT_DETAILS_UPDATE]: "Talent notes / follow-up edited",
  [AUDIT_ACTIONS.EMPLOYER_STATUS_SET]: "Employer status changed",
  [AUDIT_ACTIONS.EMPLOYER_DETAILS_UPDATE]: "Employer notes / follow-up edited",
  [AUDIT_ACTIONS.PROFILE_VERIFIED_SET]: "Directory listing changed",
  [AUDIT_ACTIONS.USER_ROLE_SET]: "Account role changed",
  [AUDIT_ACTIONS.INTEREST_STATUS_SET]: "Interest status changed",
  [AUDIT_ACTIONS.DATA_EXPORT]: "Data exported (CSV)",
  [AUDIT_ACTIONS.CV_DOWNLOAD]: "CV downloaded",
  [AUDIT_ACTIONS.TRAINING_VIDEO_SET]: "Training video uploaded",
  [AUDIT_ACTIONS.TRAINING_MODULE_PUBLISHED]: "Training module published",
};

// Renders a before/after pair as "old → new" per field. Values are whatever the
// action stored, so this stays deliberately generic.
function describeChange(
  before: unknown,
  after: unknown
): { field: string; from: string; to: string }[] {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const fields = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
  return fields.map((field) => ({
    field,
    from: format(b[field]),
    to: format(a[field]),
  }));
}

function format(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  const str = String(value);
  return str.length > 60 ? `${str.slice(0, 60)}…` : str;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; page?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const { actor = "", action = "", page = "1" } = await searchParams;
  const all = await listAuditLogs({
    actor: actor.trim() || undefined,
    action: action.trim() || undefined,
  });

  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (actor) sp.set("actor", actor);
    if (action) sp.set("action", action);
    sp.set("page", String(n));
    return `/admin/audit?${sp.toString()}`;
  };

  return (
    <div className="flex-1 bg-gray-50 px-4 pt-28 pb-8 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-ink">Audit Log</h1>
            <p className="text-gray-600">
              Every admin action, newest first. Records are append-only and are never removed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/admin" className={navLink}>← Pipeline</Link>
            <Link href="/admin/users" className={navLink}>Users</Link>
            <Link href="/admin/directory" className={navLink}>Directory</Link>
            <Link href="/admin/interests" className={navLink}>Interests</Link>
            <Link href="/admin/training" className={navLink}>Training</Link>
          </div>
        </div>

        <form method="get" action="/admin/audit" className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="actor"
            defaultValue={actor}
            placeholder="Filter by admin email…"
            className="w-full sm:w-64 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <select
            name="action"
            defaultValue={action}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">All actions</option>
            {Object.values(AUDIT_ACTIONS).map((value) => (
              <option key={value} value={value}>
                {ACTION_LABELS[value] ?? value}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-black hover:bg-gold/85">
            Filter
          </button>
          {(actor || action) && (
            <Link href="/admin/audit" className="text-sm text-gray-500 hover:text-black">Clear</Link>
          )}
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Change</th>
                  <th className="px-6 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      {actor || action
                        ? "No entries match this filter."
                        : "No admin actions recorded yet."}
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const changes = describeChange(row.before, row.after);
                  return (
                    <tr key={row.id} className="border-b border-gray-100 align-top hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium break-all">
                        {row.actorEmail}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {ACTION_LABELS[row.action] ?? row.action}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {row.targetId ? (
                          <>
                            <span className="uppercase tracking-wide">{row.targetType}</span>
                            <br />
                            <span className="font-mono">{row.targetId.slice(0, 8)}…</span>
                          </>
                        ) : (
                          <span className="uppercase tracking-wide">{row.targetType}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-xs">
                        {changes.length === 0 ? (
                          "—"
                        ) : (
                          <ul className="space-y-0.5">
                            {changes.map((c) => (
                              <li key={c.field}>
                                <span className="text-gray-400">{c.field}:</span> {c.from}{" "}
                                <span className="text-gray-400">→</span>{" "}
                                <span className="font-medium">{c.to}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs font-mono">{row.ip ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 text-sm">
              <span className="text-gray-500">
                {all.length} entries · page {current} of {pages}
              </span>
              <div className="flex gap-2">
                {current > 1 && (
                  <Link href={pageHref(current - 1)} className={navLink}>← Newer</Link>
                )}
                {current < pages && (
                  <Link href={pageHref(current + 1)} className={navLink}>Older →</Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
