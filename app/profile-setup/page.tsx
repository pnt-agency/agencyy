import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTalentProfile, getEmployerProfile } from "@/lib/db/queries";
import { ProfileSetupForm, type ProfileInitial } from "@/components/member/profile-setup-form";

export default async function ProfileSetupPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const role = (user.role === "talent" || user.role === "employer") ? user.role : "user";
  const roleLocked = role !== "user";

  // Load whichever profile already exists so the form is pre-filled on return.
  const [talent, employer] = await Promise.all([
    role !== "employer" ? getTalentProfile(user.id) : Promise.resolve(null),
    role !== "talent" ? getEmployerProfile(user.id) : Promise.resolve(null),
  ]);

  const initial: ProfileInitial = {
    name: user.name ?? "there",
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
