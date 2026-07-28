import { AuthForm } from "@/components/auth/auth-form";

// NextAuth redirects OAuth failures back here (pages.error) with an `error`
// code. Translate the ones a real user can hit into plain language; anything
// else falls back to a generic message rather than leaking an internal code.
const OAUTH_ERRORS: Record<string, string> = {
  AccessDenied:
    "Google sign-in was cancelled, or that Google account's email address isn't confirmed with Google.",
  OAuthAccountNotLinked:
    "An account with this email already exists. Sign in with your password instead.",
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in did not complete. Please try again.",
  OAuthCreateAccount: "Could not create your account from Google. Please try again.",
  Callback: "Google sign-in did not complete. Please try again.",
  Configuration: "Google sign-in isn't configured correctly. Please contact support.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const oauthError = error
    ? OAUTH_ERRORS[error] ?? "Sign-in failed. Please try again."
    : null;

  return <AuthForm oauthError={oauthError} />;
}
