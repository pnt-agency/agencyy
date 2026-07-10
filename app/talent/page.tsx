import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listVerifiedTalent } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { TALENT_ROLES } from "@/lib/roles";

export default async function TalentDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  // Directory is for employers (admins may view too). Talent go to their dashboard.
  if (user.role !== "employer" && user.role !== "admin") redirect("/dashboard");

  const { role = "", q = "" } = await searchParams;
  const talent = await listVerifiedTalent({ role: role || undefined, skill: q || undefined });

  return (
    <div className="flex-1 bg-gray-50 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-black text-black mb-2">Verified Talent</h1>
          <p className="text-gray-500">Browse our vetted network and express interest — our team makes the introduction.</p>
        </div>

        {/* Filters */}
        <form method="get" action="/talent" className="flex flex-col sm:flex-row gap-3 mb-8">
          <select
            name="role"
            defaultValue={role}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All roles</option>
            {TALENT_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search skills…"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button type="submit" className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/85">
            Filter
          </button>
          {(role || q) && (
            <Link href="/talent" className="flex items-center px-3 text-sm text-gray-500 hover:text-black">Clear</Link>
          )}
        </form>

        {talent.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
            <p className="text-gray-600 font-medium">No talent matches your filters yet.</p>
            <p className="text-gray-400 text-sm mt-1">Try broadening the role or skills, or check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talent.map((t) => (
              <Link
                key={t.userId}
                href={`/talent/${t.userId}`}
                className="group bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <Badge variant="success">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>
                  </Badge>
                </div>
                <h3 className="font-bold text-black group-hover:text-black">{t.name}</h3>
                {t.role && <p className="text-sm text-gray-600">{t.role}</p>}
                {t.skills && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{t.skills}</p>}
                {t.bio && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{t.bio}</p>}
                <span className="inline-block mt-4 text-sm font-semibold text-black group-hover:underline">View profile →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
