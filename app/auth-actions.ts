"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  registerMemberSchema,
  saveProfileSchema,
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import {
  getUserByEmail,
  createUser,
  setUserRole,
  setUserPassword,
  markEmailVerified,
  upsertTalentProfile,
  upsertEmployerProfile,
  createAuthToken,
  findValidAuthToken,
  deleteAuthToken,
} from "@/lib/db/queries";
import {
  generateToken,
  hashToken,
  tokenExpiry,
  appBaseUrl,
  VERIFY_EMAIL,
  RESET_PASSWORD,
} from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/resend";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

// Create a fresh verification token and email its link. Best-effort; callers
// decide whether a failure should surface.
async function issueVerificationEmail(userId: string, email: string, name: string) {
  const { raw, hash } = generateToken();
  await createAuthToken({
    userId,
    tokenHash: hash,
    purpose: VERIFY_EMAIL,
    expiresAt: tokenExpiry(VERIFY_EMAIL),
  });
  await sendVerificationEmail(email, name, `${appBaseUrl()}/verify-email?token=${raw}`);
}

// Normalize an optional/empty-string form value to a nullable DB value.
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Public registration. Creates a member account with a chosen talent/employer
 * role. The client follows a successful result with a credentials signIn().
 */
export async function registerMember(data: unknown): Promise<ActionResult> {
  const parsed = registerMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Please check your details and try again." };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  let user;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await createUser({ name, email, passwordHash, role });
  } catch (error) {
    console.error("Error registering member:", error);
    return { success: false, error: "Could not create your account. Please try again." };
  }

  // Send the verification email (non-critical — account still works if it fails).
  try {
    await issueVerificationEmail(user.id, user.email, user.name);
  } catch (error) {
    console.warn("Verification email could not be sent:", error);
  }

  return { success: true };
}

/**
 * Persists the signed-in member's profile. Requires an authenticated session,
 * upserts the role-appropriate profile table, and promotes a transient "user"
 * (fresh Google signup) to their chosen talent/employer role.
 */
export async function saveMemberProfile(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be signed in to save your profile." };
  }

  const parsed = saveProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please check your entries and try again." };
  }

  const { role } = parsed.data;

  // Only allow choosing a role while still transient; otherwise the account's
  // existing talent/employer role is authoritative.
  const effectiveRole = user.role === "user" ? role : user.role;
  if (effectiveRole !== "talent" && effectiveRole !== "employer") {
    return { success: false, error: "Unsupported account role." };
  }

  try {
    if (effectiveRole === "talent") {
      const t = parsed.data.talent ?? {};
      await upsertTalentProfile(user.id, {
        phone: orNull(t.phone),
        country: orNull(t.country),
        role: orNull(t.role),
        bio: orNull(t.bio),
        skills: orNull(t.skills),
        portfolio: orNull(t.portfolio),
      });
    } else {
      const e = parsed.data.employer ?? {};
      await upsertEmployerProfile(user.id, {
        companyName: orNull(e.companyName),
        phone: orNull(e.phone),
        country: orNull(e.country),
        bio: orNull(e.bio),
      });
    }

    if (user.role === "user") {
      await setUserRole(user.id, effectiveRole);
    }

    revalidatePath("/dashboard");
    revalidatePath("/profile-setup");
    return { success: true };
  } catch (error) {
    console.error("Error saving member profile:", error);
    return { success: false, error: "Could not save your profile. Please try again." };
  }
}

// ---------- Email verification ----------

export async function verifyEmail(rawToken: string): Promise<ActionResult> {
  if (!rawToken) {
    return { success: false, error: "Invalid verification link." };
  }
  const token = await findValidAuthToken(hashToken(rawToken), VERIFY_EMAIL);
  if (!token) {
    return { success: false, error: "This verification link is invalid or has expired." };
  }
  await markEmailVerified(token.userId);
  await deleteAuthToken(token.id);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function resendVerificationEmail(): Promise<ActionResult> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser?.email) {
    return { success: false, error: "You must be signed in." };
  }
  const user = await getUserByEmail(sessionUser.email);
  if (!user) {
    return { success: false, error: "Account not found." };
  }
  if (user.emailVerified) {
    return { success: true };
  }
  try {
    await issueVerificationEmail(user.id, user.email, user.name);
    return { success: true };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return { success: false, error: "Could not send the email. Please try again." };
  }
}

// ---------- Password reset ----------

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(input);
  // Always return the same result regardless of whether the email exists, so
  // this endpoint can't be used to enumerate accounts.
  if (parsed.success) {
    const user = await getUserByEmail(parsed.data.email);
    // Only password accounts can reset (Google-only users have no passwordHash).
    if (user?.passwordHash) {
      try {
        const { raw, hash } = generateToken();
        await createAuthToken({
          userId: user.id,
          tokenHash: hash,
          purpose: RESET_PASSWORD,
          expiresAt: tokenExpiry(RESET_PASSWORD),
        });
        await sendPasswordResetEmail(
          user.email,
          `${appBaseUrl()}/reset-password?token=${raw}`
        );
      } catch (error) {
        console.error("Error sending password reset email:", error);
      }
    }
  }
  return { success: true };
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  const token = await findValidAuthToken(hashToken(parsed.data.token), RESET_PASSWORD);
  if (!token) {
    return { success: false, error: "This reset link is invalid or has expired." };
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await setUserPassword(token.userId, passwordHash);
    await deleteAuthToken(token.id);
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Could not reset your password. Please try again." };
  }
}
