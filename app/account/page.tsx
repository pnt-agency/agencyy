import { redirect } from "next/navigation";
import { getCurrentAccount, isEmailVerified } from "@/lib/auth";
import { AccountSettings, type AccountSummary } from "@/components/member/account-settings";

const ACCOUNT_TYPES: Record<string, string> = {
  admin: "Admin",
  talent: "Talent",
  employer: "Employer",
};

export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) {
    redirect("/");
  }

  // Deliberately not gated on email verification, unlike /profile-setup:
  // signing out and deleting an account are exactly the things someone who
  // can't verify their address still needs to be able to do.
  const summary: AccountSummary = {
    name: account.name,
    email: account.email,
    accountType: ACCOUNT_TYPES[account.role] ?? "Not chosen yet",
    memberSince: new Date(account.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    emailVerified: isEmailVerified(account),
  };

  return <AccountSettings account={summary} />;
}
