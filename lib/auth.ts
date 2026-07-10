import { NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { db } from "./db";
import { users } from "./db/schema";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@agencybuild.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email));

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    // Restrict Google sign-in to emails that already exist in the users table —
    // otherwise any Google account could authenticate into /admin.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) return false;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, profile.email));
        return Boolean(user);
      }
      return true;
    },
  },
};

/**
 * Returns the current session only if it belongs to an admin user, else null.
 * Authorization is resolved against the database (the source of truth) rather
 * than trusting a claim in the session token — a valid login is not the same
 * as being an admin.
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (user?.role !== "admin") return null;

  return session;
}
