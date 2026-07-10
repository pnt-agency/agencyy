import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserByEmail,
  getTalentProfile,
  getEmployerProfile,
  countTalentApplicationsByEmail,
  countEmployerInquiriesByEmail,
} from "@/lib/db/queries";
import { DashboardView } from "@/components/member/dashboard-view";

function completeness(fields: Array<string | null | undefined>): number {
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  return fields.length === 0 ? 0 : Math.round((filled / fields.length) * 100);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.email) {
    redirect("/");
  }

  const isEmployer = user.role === "employer";

  // Fetch the account row (for createdAt) and role-specific real metrics.
  const [account, talentProfile, employerProfile, leadCount] = await Promise.all([
    getUserByEmail(user.email),
    isEmployer ? Promise.resolve(null) : getTalentProfile(user.id),
    isEmployer ? getEmployerProfile(user.id) : Promise.resolve(null),
    isEmployer
      ? countEmployerInquiriesByEmail(user.email)
      : countTalentApplicationsByEmail(user.email),
  ]);

  const profileCompleteness = isEmployer
    ? completeness([
        employerProfile?.companyName,
        employerProfile?.phone,
        employerProfile?.country,
        employerProfile?.bio,
      ])
    : completeness([
        talentProfile?.phone,
        talentProfile?.country,
        talentProfile?.bio,
        talentProfile?.skills,
        talentProfile?.portfolio,
      ]);

  const memberSince = account?.createdAt
    ? new Date(account.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <DashboardView
      name={user.name ?? "there"}
      role={user.role}
      email={user.email}
      memberSince={memberSince}
      profileCompleteness={profileCompleteness}
      leadCount={leadCount}
      emailVerified={Boolean(account?.emailVerified)}
    />
  );
}
