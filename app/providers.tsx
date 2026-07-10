"use client";

import { SessionProvider } from "next-auth/react";

// Client boundary that exposes the NextAuth session to client components via
// useSession(). Wraps the app in the root layout.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
