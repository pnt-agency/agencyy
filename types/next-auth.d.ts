import "next-auth";
import "next-auth/jwt";

// Augment NextAuth's default types with the fields we thread through the JWT
// and session (see callbacks in lib/auth.ts).
declare module "next-auth" {
  interface User {
    role: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
