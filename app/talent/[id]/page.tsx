import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getVerifiedTalentById } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { ExpressInterestButton } from "@/components/directory/express-interest-button";

export default async function TalentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "employer" && user.role !== "admin") redirect("/dashboard");

  const { id } = await params;
  const talent = await getVerifiedTalentById(id);

  if (!talent) {
    return (
      <div className="flex-1 bg-gray-50 pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-2xl font-display font-black text-black mb-2">Talent not available</h1>
          <p className="text-gray-500 mb-6">This profile isn&apos;t listed in the directory.</p>
          <Link href="/talent" className="text-sm font-semibold text-black hover:underline">← Back to directory</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 pt-32 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/talent" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-2xl font-black">
                {talent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-black">{talent.name}</h1>
                {talent.role && <p className="text-gray-600">{talent.role}</p>}
              </div>
            </div>
            <Badge variant="success">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>
            </Badge>
          </div>

          {talent.skills && (
            <section className="mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Skills</h2>
              <p className="text-gray-800">{talent.skills}</p>
            </section>
          )}

          {talent.bio && (
            <section className="mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">About</h2>
              <p className="text-gray-800 whitespace-pre-line">{talent.bio}</p>
            </section>
          )}

          {talent.portfolio && (
            <section className="mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Portfolio</h2>
              <a href={talent.portfolio} target="_blank" rel="noopener noreferrer" className="text-black font-semibold underline hover:no-underline break-all">
                {talent.portfolio}
              </a>
            </section>
          )}

          <div className="border-t border-gray-100 pt-6 mt-6">
            <p className="text-sm text-gray-500 mb-3">
              Contact details are shared once our team makes the introduction.
            </p>
            <ExpressInterestButton talentId={talent.userId} />
          </div>
        </div>
      </div>
    </div>
  );
}
