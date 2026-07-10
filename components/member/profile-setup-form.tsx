"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, User, CheckCircle2 } from "lucide-react";
import { saveMemberProfile } from "@/app/auth-actions";
import { TALENT_ROLES } from "@/lib/roles";

type Role = "talent" | "employer";

export type ProfileInitial = {
  name: string;
  role: Role | "user";
  roleLocked: boolean;
  phone: string;
  country: string;
  talentRole: string;
  bio: string;
  skills: string;
  portfolio: string;
  companyName: string;
};

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all";

export function ProfileSetupForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // A returning member has a fixed role; a fresh (Google) signup picks one here.
  const [role, setRole] = useState<Role>(
    initial.role === "employer" ? "employer" : "talent"
  );
  const roleLocked = initial.roleLocked;

  const [phone, setPhone] = useState(initial.phone);
  const [country, setCountry] = useState(initial.country);
  const [talentRole, setTalentRole] = useState(initial.talentRole);
  const [bio, setBio] = useState(initial.bio);
  const [skills, setSkills] = useState(initial.skills);
  const [portfolio, setPortfolio] = useState(initial.portfolio);
  const [company, setCompany] = useState(initial.companyName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload =
      role === "talent"
        ? { role, talent: { phone, country, role: talentRole, bio, skills, portfolio } }
        : { role, employer: { companyName: company, phone, country, bio } };

    startTransition(async () => {
      const result = await saveMemberProfile(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 py-24">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 p-10 animate-fade-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-black text-black mb-2">
            {initial.roleLocked ? "Your profile" : "Complete your profile"}
          </h1>
          <p className="text-gray-500">
            Signed in as <span className="font-semibold text-gray-700">{initial.name}</span>. Keep your details up to date to get the best matches.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <span className="block text-sm font-bold text-gray-700 mb-3">How will you use Agency Build?</span>
            <div className="grid grid-cols-2 gap-4">
              {([
                { value: "employer", title: "I'm an Employer", desc: "Looking to hire verified talent", icon: Briefcase },
                { value: "talent", title: "I'm a Talent", desc: "Looking for remote opportunities", icon: User },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={roleLocked}
                  onClick={() => setRole(opt.value)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all relative disabled:cursor-not-allowed ${
                    role === opt.value ? "border-black bg-black/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  } ${roleLocked && role !== opt.value ? "opacity-40" : ""}`}
                >
                  <opt.icon className={`w-6 h-6 mb-3 ${role === opt.value ? "text-black" : "text-gray-400"}`} />
                  <h3 className={`font-bold ${role === opt.value ? "text-black" : "text-gray-700"}`}>{opt.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  {role === opt.value && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-black" />}
                </button>
              ))}
            </div>
            {roleLocked && (
              <p className="text-xs text-gray-400 mt-2">Your account type is set and can&apos;t be changed here.</p>
            )}
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-bold text-gray-700 mb-1.5">Location / Country</label>
                <input id="country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" className={inputClass} />
              </div>
            </div>

            {role === "employer" ? (
              <div className="animate-fade-up">
                <label htmlFor="company" className="block text-sm font-bold text-gray-700 mb-1.5">Company Name</label>
                <input id="company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" className={inputClass} />
              </div>
            ) : (
              <div className="animate-fade-up space-y-5">
                <div>
                  <label htmlFor="talentRole" className="block text-sm font-bold text-gray-700 mb-1.5">Primary Role</label>
                  <select id="talentRole" value={talentRole} onChange={(e) => setTalentRole(e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="">Select your primary role…</option>
                    {TALENT_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="portfolio" className="block text-sm font-bold text-gray-700 mb-1.5">Portfolio / LinkedIn URL</label>
                  <input id="portfolio" type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://linkedin.com/in/..." className={inputClass} />
                </div>
                <div>
                  <label htmlFor="skills" className="block text-sm font-bold text-gray-700 mb-1.5">Primary Skills</label>
                  <input id="skills" type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Next.js, UI/UX Design" className={inputClass} />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="bio" className="block text-sm font-bold text-gray-700 mb-1.5">Short Bio</label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={role === "employer" ? "Tell us about your company and what kind of talent you are looking for..." : "Tell us a bit about your experience and what you excel at..."}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-black/90 disabled:opacity-50 disabled:cursor-wait transition-all shadow-lg"
          >
            {isPending ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
