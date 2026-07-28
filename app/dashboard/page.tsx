import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserByEmail,
  getTalentProfile,
  getEmployerProfile,
  countTalentApplicationsForUser,
  countEmployerInquiriesForUser,
  countInterestsForTalent,
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

  // Resolve the role from the database, not the session token. The JWT caches
  // whatever role the account held when it signed in and never refreshes it
  // (see the jwt callback in lib/auth.ts — it only queries when role is unset),
  // so a promoted admin would keep seeing the talent dashboard, pending-review
  // banner and all, until their token expired. getAdminSession() already treats
  // the database as authoritative; this makes the dashboard agree with it.
  const account = await getUserByEmail(user.email);
  const role = account?.role ?? user.role;
  const isEmployer = role === "employer";

  // Role-specific metrics. Only talent/employer own a profile, so an admin
  // fetches nothing and the view hides those panels.
  const [talentProfile, employerProfile, leadCount, interestCount] = await Promise.all([
    isEmployer ? Promise.resolve(null) : getTalentProfile(user.id),
    isEmployer ? getEmployerProfile(user.id) : Promise.resolve(null),
    isEmployer
      ? countEmployerInquiriesForUser(user.id, user.email)
      : countTalentApplicationsForUser(user.id, user.email),
    isEmployer ? Promise.resolve(0) : countInterestsForTalent(user.id),
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
        talentProfile?.role,
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
      role={role}
      email={user.email}
      memberSince={memberSince}
      profileCompleteness={profileCompleteness}
      leadCount={leadCount}
      emailVerified={Boolean(account?.emailVerified)}
      listed={Boolean(talentProfile?.verified)}
      interestCount={interestCount}
    />
  );
}
