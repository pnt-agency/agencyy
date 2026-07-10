"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  registerMemberSchema,
  saveProfileSchema,
} from "@/lib/validation";
import {
  getUserByEmail,
  createUser,
  setUserRole,
  upsertTalentProfile,
  upsertEmployerProfile,
} from "@/lib/db/queries";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

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

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await createUser({ name, email, passwordHash, role });
    return { success: true };
  } catch (error) {
    console.error("Error registering member:", error);
    return { success: false, error: "Could not create your account. Please try again." };
  }
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
