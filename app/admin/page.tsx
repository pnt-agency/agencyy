import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { listTalentRecords, listEmployerRecords } from "@/lib/db/queries";
import type { TalentRow, EmployerRow } from "@/lib/db/schema";
import { TalentStatusUpdater } from "@/components/admin/talent-status-updater";
import { EmployerStatusUpdater } from "@/components/admin/employer-status-updater";
import { ExportDataButton } from "@/components/admin/export-data-button";
import { EditableFollowUp, EditableNotes } from "@/components/admin/editable-cells";

const PAGE_SIZE = 15;

function toInputDate(date: Date | null): string {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function paginate<T>(rows: T[], page: number) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  return { slice: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), total, pages, current };
}

function Pager({
  current,
  pages,
  total,
  hrefFor,
}: {
  current: number;
  pages: number;
  total: number;
  hrefFor: (p: number) => string;
}) {
  const linkClass = "px-3 py-1.5 rounded-md border border-gray-200 font-medium text-gray-700 hover:bg-gray-50";
  const disabledClass = "px-3 py-1.5 rounded-md border border-gray-100 font-medium text-gray-300 cursor-default";
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm">
      <span className="text-gray-500">{total} total · Page {current} of {pages}</span>
      <div className="flex gap-2">
        {current > 1 ? <Link href={hrefFor(current - 1)} className={linkClass}>Previous</Link> : <span className={disabledClass}>Previous</span>}
        {current < pages ? <Link href={hrefFor(current + 1)} className={linkClass}>Next</Link> : <span className={disabledClass}>Next</span>}
      </div>
    </div>
  );
}

function SearchForm({
  name,
  value,
  placeholder,
  preserve,
  clearHref,
}: {
  name: string;
  value: string;
  placeholder: string;
  preserve: Record<string, string | undefined>;
  clearHref: string;
}) {
  return (
    <form method="get" action="/admin" className="flex items-center gap-2">
      {Object.entries(preserve).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        type="text"
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        className="w-56 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <button type="submit" className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-black/85">
        Search
      </button>
      {value && (
        <Link href={clearHref} className="text-sm text-gray-500 hover:text-black">Clear</Link>
      )}
    </form>
  );
}

function matchTalent(t: TalentRow, q: string) {
  const hay = `${t.name} ${t.email} ${t.role} ${t.country}`.toLowerCase();
  return hay.includes(q);
}

function matchEmployer(e: EmployerRow, q: string) {
  const hay = `${e.companyName} ${e.contactName} ${e.email} ${e.roleNeeded}`.toLowerCase();
  return hay.includes(q);
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tq?: string; tp?: string; eq?: string; ep?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/");
  }

  const { tq = "", tp, eq = "", ep } = await searchParams;

  const [allTalents, allEmployers] = await Promise.all([
    listTalentRecords(),
    listEmployerRecords(),
  ]);

  const talentQuery = tq.trim().toLowerCase();
  const employerQuery = eq.trim().toLowerCase();

  const filteredTalents = talentQuery ? allTalents.filter((t) => matchTalent(t, talentQuery)) : allTalents;
  const filteredEmployers = employerQuery ? allEmployers.filter((e) => matchEmployer(e, employerQuery)) : allEmployers;

  const talentPage = paginate(filteredTalents, Number(tp) || 1);
  const employerPage = paginate(filteredEmployers, Number(ep) || 1);

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session.user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/directory" className="text-sm font-semibold text-gray-600 hover:text-black">Talent Directory</Link>
            <Link href="/admin/interests" className="text-sm font-semibold text-gray-600 hover:text-black">Interests</Link>
            {/* Export always covers ALL records, not the filtered/paged view. */}
            <ExportDataButton talents={allTalents} employers={allEmployers} />
          </div>
        </div>

        {/* Talent Tracker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-bold text-navy">Talent Pipeline</h2>
            <SearchForm
              name="tq"
              value={tq}
              placeholder="Search name, email, role…"
              preserve={{ eq, ep }}
              clearHref={`/admin${qs({ eq, ep })}`}
            />
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
                {talentPage.slice.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      {talentQuery ? "No talent matches your search." : "No talent applications yet."}
                    </td>
                  </tr>
                )}
                {talentPage.slice.map((talent) => (
                  <tr key={talent.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{talent.name}</td>
                    <td className="px-6 py-4 text-gray-600">{talent.role}</td>
                    <td className="px-6 py-4 text-gray-600">{talent.country}</td>
                    <td className="px-6 py-4">
                      <Badge variant={talent.status === "Verified" ? "success" : "default"}>
                        {talent.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <EditableFollowUp id={talent.id} kind="talent" initial={toInputDate(talent.followUpDate)} />
                    </td>
                    <td className="px-6 py-4">
                      <EditableNotes id={talent.id} kind="talent" initial={talent.notes ?? ""} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <TalentStatusUpdater id={talent.id} currentStatus={talent.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            current={talentPage.current}
            pages={talentPage.pages}
            total={talentPage.total}
            hrefFor={(p) => `/admin${qs({ tq, tp: String(p), eq, ep })}`}
          />
        </div>

        {/* Employer Tracker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-bold text-navy">Employer Inquiries</h2>
            <SearchForm
              name="eq"
              value={eq}
              placeholder="Search company, contact, role…"
              preserve={{ tq, tp }}
              clearHref={`/admin${qs({ tq, tp })}`}
            />
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
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employerPage.slice.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      {employerQuery ? "No employer matches your search." : "No employer inquiries yet."}
                    </td>
                  </tr>
                )}
                {employerPage.slice.map((employer) => (
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
                    <td className="px-6 py-4">
                      <EditableFollowUp id={employer.id} kind="employer" initial={toInputDate(employer.followUpDate)} />
                    </td>
                    <td className="px-6 py-4">
                      <EditableNotes id={employer.id} kind="employer" initial={employer.notes ?? ""} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <EmployerStatusUpdater id={employer.id} currentStatus={employer.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            current={employerPage.current}
            pages={employerPage.pages}
            total={employerPage.total}
            hrefFor={(p) => `/admin${qs({ tq, tp, eq, ep: String(p) })}`}
          />
        </div>
      </div>
    </div>
  );
}
