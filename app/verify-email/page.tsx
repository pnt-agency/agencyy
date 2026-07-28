import { redirect } from "next/navigation";
import { getCurrentAccount, isEmailVerified } from "@/lib/auth";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";
import { VerifyEmailPending } from "@/components/auth/verify-email-pending";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // With a token this is the landing page for the emailed link — it must work
  // signed out, since people open mail wherever they happen to be logged in.
  // Without one it's the "check your inbox" waiting room for the signed-in
  // member we just bounced off /profile-setup.
  let body = <VerifyEmailClient token={token ?? ""} />;

  if (!token) {
    const account = await getCurrentAccount();
    if (!account) {
      redirect("/");
    }
    if (isEmailVerified(account)) {
      redirect("/dashboard");
    }
    body = <VerifyEmailPending email={account.email} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
        {body}
      </div>
    </div>
  );
}
