import { NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { db } from "./db";
import { users, type UserRow } from "./db/schema";
import { softDeleteUser } from "./db/queries";
import { sendWelcomeEmail } from "./resend";
import { appBaseUrl } from "./tokens";
import { issueTwoStepCode, verifyTwoStepCode, SIGN_IN_CODE } from "./two-step";
import { TWO_STEP_ERRORS } from "./two-step-shared";

// Fail loudly in production if the session-signing secret is missing, rather
// than silently falling back to an auto-generated (and unstable) one.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set.");
}

// A soft-deleted account keeps its row for analytics but must behave as if it
// were gone: it can't sign in, can't be found, and doesn't hold its old email
// (softDeleteUser rewrites it to a tombstone, freeing the address for reuse).
const activeUser = isNull(users.deletedAt);

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "you@example.com" },
      password: { label: "Password", type: "password" },
      // Only sent on the second round of a two-step sign-in.
      passcode: { label: "Sign-in code", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email.trim().toLowerCase();
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), activeUser));

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      // Two-step verification. Everything below runs only after the password
      // checked out, so none of these distinct errors tell a caller anything
      // about an account whose password they don't already have.
      //
      // The flow is two calls to signIn() with the same email and password:
      // the first (no code) emails one and throws REQUIRED, which NextAuth
      // surfaces as result.error so the form can ask for it; the second
      // carries the code. The password is re-checked both times, so the code
      // alone is never enough.
      if (user.twoStepEnabledAt) {
        if (!credentials.passcode) {
          const issued = await issueTwoStepCode(user, SIGN_IN_CODE);
          if (issued === "rate_limited") throw new Error(TWO_STEP_ERRORS.RATE_LIMITED);
          if (issued === "send_failed") throw new Error(TWO_STEP_ERRORS.SEND_FAILED);
          throw new Error(TWO_STEP_ERRORS.REQUIRED);
        }
        const verified = await verifyTwoStepCode(user.id, SIGN_IN_CODE, credentials.passcode);
        if (verified === "rate_limited") throw new Error(TWO_STEP_ERRORS.RATE_LIMITED);
        if (verified !== "ok") throw new Error(TWO_STEP_ERRORS.INVALID);
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

        // Scoped to active users: a returning member whose account was deleted
        // gets a brand-new one rather than being handed the tombstone. The old
        // row no longer holds this address, so the insert below can't collide.
        let existing: UserRow | undefined = (
          await db
            .select()
            .from(users)
            .where(and(eq(users.email, email), activeUser))
        )[0];

        // An unverified password account at this address is replaced, never
        // adopted. Nothing ever proved whoever created it owns the address —
        // anyone can register as someone else's email — so adopting it would
        // hand the real owner an account whose password, and whose live
        // sessions, belong to that stranger: register as the victim, sign in,
        // wait for the victim to arrive via Google, and you're in their account.
        //
        // Replacing it gives the Google user a new id, which is what actually
        // revokes the stranger: activeSession() only honours a session for the
        // account id it was issued to. Clearing the password alone would not —
        // an existing session would carry straight on.
        //
        // Cost, in the rare honest case (someone registered, never clicked
        // their link, then used Google): the new account starts at role "user",
        // so they pick talent/employer again. Nothing else is lost — an
        // unverified account can't reach profile setup to have built anything.
        if (existing && !existing.emailVerified) {
          console.warn(
            `[auth] replacing unverified password account ${existing.id} on Google sign-in`
          );
          await softDeleteUser(existing.id);
          existing = undefined;
        }

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
          .where(and(eq(users.email, token.email), activeUser));
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
 * Session plus the account row behind it, or null if there's no session or the
 * account no longer exists. Every accessor below funnels through this so a
 * cookie that outlived its account — an expired JWT is up to 30 days behind
 * reality, and deleting an account can't reach into the browser — stops
 * authenticating the moment the row goes.
 *
 * The account must also be the *same* one the session was issued to, not just
 * one holding the same address. Emails get reused: a deleted account frees its
 * address for a new signup, and Google sign-in replaces an unverified password
 * account (see the signIn callback). Matching by email alone would let a cookie
 * from the old account walk straight into the new one.
 */
async function activeSession(): Promise<{ session: Session; account: UserRow } | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!session || !email) return null;

  const [account] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.trim().toLowerCase()), activeUser));
  if (!account || account.id !== session.user.id) return null;
  return { session, account };
}

/**
 * Returns the current session only if it belongs to an admin user, else null.
 * Authorization is resolved against the database (the source of truth) rather
 * than trusting a claim in the session token — a valid login is not the same
 * as being an admin.
 */
export async function getAdminSession(): Promise<Session | null> {
  const current = await activeSession();
  return current?.account.role === "admin" ? current.session : null;
}

/**
 * The acting admin's database row, or null if the caller isn't an admin.
 *
 * Same authorization as getAdminSession(), but it hands back *who* rather than
 * just *whether* — which is what the audit log needs. Admin mutations should
 * prefer this: an action that can't name its actor can't be audited.
 */
export async function getAdminAccount(): Promise<UserRow | null> {
  const current = await activeSession();
  return current?.account.role === "admin" ? current.account : null;
}

/**
 * Returns the current authenticated session user (any role), or null. Used to
 * gate member pages/actions. Callers that need role-specific behavior read
 * session.user.role.
 */
export async function getCurrentUser(): Promise<Session["user"] | null> {
  const current = await activeSession();
  return current?.session.user ?? null;
}

/**
 * The signed-in member's database row, or null when signed out (or when the
 * session outlived the account). Prefer this over getCurrentUser() wherever the
 * answer depends on state the JWT doesn't refresh — role changes and, above
 * all, emailVerified: a token minted at signup says "unverified" forever, so
 * trusting it would keep someone locked out after they clicked the link.
 */
export async function getCurrentAccount(): Promise<UserRow | null> {
  const current = await activeSession();
  return current?.account ?? null;
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
