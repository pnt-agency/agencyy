import { redirect } from "next/navigation";
import { getCurrentAccount, isEmailVerified } from "@/lib/auth";
import { getTalentProfile, getEmployerProfile } from "@/lib/db/queries";
import { ProfileSetupForm, type ProfileInitial } from "@/components/member/profile-setup-form";

export default async function ProfileSetupPage() {
  // The account row, not the session token: emailVerified is the gate below and
  // the JWT's copy of it never refreshes after signup.
  const account = await getCurrentAccount();
  if (!account) {
    redirect("/");
  }

  // An unverified email+password signup can't see or edit a profile yet. The
  // matching check in saveMemberProfile() is the one that actually protects the
  // data — this redirect is the UX half of the same rule.
  if (!isEmailVerified(account)) {
    redirect("/verify-email");
  }

  const role = (account.role === "talent" || account.role === "employer") ? account.role : "user";
  const roleLocked = role !== "user";

  // Load whichever profile already exists so the form is pre-filled on return.
  const [talent, employer] = await Promise.all([
    role !== "employer" ? getTalentProfile(account.id) : Promise.resolve(null),
    role !== "talent" ? getEmployerProfile(account.id) : Promise.resolve(null),
  ]);

  const initial: ProfileInitial = {
    name: account.name ?? "there",
    role,
    roleLocked,
    phone: talent?.phone ?? employer?.phone ?? "",
    country: talent?.country ?? employer?.country ?? "",
    talentRole: talent?.role ?? "",
    bio: talent?.bio ?? employer?.bio ?? "",
    skills: talent?.skills ?? "",
    portfolio: talent?.portfolio ?? "",
    companyName: employer?.companyName ?? "",
  };

  return <ProfileSetupForm initial={initial} />;
}
