import { NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { db } from "./db";
import { users } from "./db/schema";

// Fail loudly in production if the session-signing secret is missing, rather
// than silently falling back to an auto-generated (and unstable) one.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set.");
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "you@example.com" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email.trim().toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, email));

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  }),
];

// Only register Google when it's actually configured — an empty clientId/secret
// produces a provider that fails confusingly at runtime.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent select_account",
        },
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    // Auto-provision a member account on first Google sign-in. New Google users
    // get the transient "user" role and pick talent/employer during profile
    // setup. Existing users (including admins) keep their stored role.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) return false;
        const email = profile.email.trim().toLowerCase();
        const [existing] = await db.select().from(users).where(eq(users.email, email));
        if (!existing) {
          await db.insert(users).values({
            name: profile.name ?? email,
            email,
            role: "user",
          });
        }
        return true;
      }
      return true;
    },
    // Put id + role on the token. Credentials sign-in supplies role directly;
    // Google sign-in doesn't, so we resolve it from the DB by email.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (token.email && !token.role) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email));
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
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

/**
 * Returns the current authenticated session (any role), or null. Used to gate
 * member pages/actions. Callers that need role-specific behavior read
 * session.user.role.
 */
export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
