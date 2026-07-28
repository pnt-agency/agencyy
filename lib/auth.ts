import { NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { db } from "./db";
import { users, type UserRow } from "./db/schema";
import { sendWelcomeEmail } from "./resend";
import { appBaseUrl } from "./tokens";

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
    // Send OAuth failures back to the sign-in page, which renders them from the
    // `error` query param, instead of NextAuth's unbranded default error page.
    error: "/",
  },
  callbacks: {
    // Auto-provision a member account on first Google sign-in. New Google users
    // get the transient "user" role and pick talent/employer during profile
    // setup. Existing users (including admins) keep their stored role.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) return false;
        const email = profile.email.trim().toLowerCase();

        // Google only sets email_verified after it has confirmed the address
        // belongs to the account holder, so it stands in for our own
        // verification link — a Google user never has to click one. Refuse
        // sign-in when it's false: an unverified Google address proves nothing
        // and would otherwise let someone claim an account by email alone.
        const googleVerified = (profile as GoogleProfile).email_verified;
        if (!googleVerified) return false;

        const [existing] = await db.select().from(users).where(eq(users.email, email));
        if (!existing) {
          const name = profile.name ?? email;
          await db.insert(users).values({
            name,
            email,
            role: "user",
            emailVerified: new Date(),
          });
          // Best-effort: a failed welcome email must never block sign-in.
          try {
            await sendWelcomeEmail(email, name, `${appBaseUrl()}/dashboard`);
          } catch (error) {
            console.warn("Welcome email could not be sent:", error);
          }
        } else if (!existing.emailVerified) {
          // Pre-existing password account whose owner just proved the address
          // through Google — clear the "please verify your email" state.
          await db
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, existing.id));
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

/**
 * The signed-in member's database row, or null when signed out (or when the
 * session outlived the account). Prefer this over getCurrentUser() wherever the
 * answer depends on state the JWT doesn't refresh — role changes and, above
 * all, emailVerified: a token minted at signup says "unverified" forever, so
 * trusting it would keep someone locked out after they clicked the link.
 */
export async function getCurrentAccount(): Promise<UserRow | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()));
  return user ?? null;
}

/**
 * Whether this account may reach member-only profile surfaces.
 *
 * Google accounts arrive with emailVerified already stamped by the signIn
 * callback (Google has proven the address), so in practice this only gates
 * email+password signups until they click their link. Admins are exempt-by-
 * construction: the seeded admin is created verified.
 */
export function isEmailVerified(account: UserRow | null): boolean {
  return Boolean(account?.emailVerified);
}
