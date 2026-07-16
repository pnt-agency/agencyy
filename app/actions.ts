"use server";

import { createTalentRecord, createEmployerRecord, updateTalentRecord, updateEmployerRecord, updateTalentMeta, updateEmployerMeta, hasRecentTalentSubmission, hasRecentEmployerSubmission, getVerifiedTalentById, hasPendingInterest, createInterest, setTalentVerified, updateInterestStatus, createNotification, getInterestParties, getTalentRecordUserId, getEmployerRecordUserId } from "@/lib/db/queries";
import { sendTalentConfirmationEmail, sendEmployerConfirmationEmail, sendAdminTalentNotification, sendAdminEmployerNotification, sendAdminInterestNotification } from "@/lib/resend";
import { Talent, Employer } from "@/types";
import { getAdminSession, getCurrentUser } from "@/lib/auth";
import { talentInputSchema, employerInputSchema, expressInterestSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function submitTalentApplication(data: Omit<Talent, "id" | "status" | "createdAt">) {
  // 0. Re-validate on the server — this action is a public endpoint and cannot
  // trust that the client ran its own validation.
  const parsed = talentInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid application. Please check your entries and try again." };
  }

  // 0b. Reject rapid duplicate submissions from the same email.
  if (await hasRecentTalentSubmission(parsed.data.email)) {
    return { success: false, error: "We already received an application from this email. Please wait a few minutes before submitting again." };
  }

  // Attribute the lead to the submitter's account when they're signed in. The
  // form is public, so a null here is normal, not an error.
  const submitter = await getCurrentUser();

  try {
    // 1. Create database record (critical — fail if this fails)
    await createTalentRecord(parsed.data, submitter?.id ?? null);
  } catch (error) {
    console.error("Error saving talent application:", error);
    return { success: false, error: "Failed to submit application. Please try again." };
  }

  // 2. Send emails (non-critical — log but don't fail). Notify the applicant
  // and the internal team; either failing must not fail the submission.
  const [confirmation, notification] = await Promise.allSettled([
    sendTalentConfirmationEmail(parsed.data.email, parsed.data.name),
    sendAdminTalentNotification(parsed.data),
  ]);
  if (confirmation.status === "rejected") {
    console.warn("Confirmation email could not be sent:", confirmation.reason);
  }
  if (notification.status === "rejected") {
    console.warn("Admin notification could not be sent:", notification.reason);
  }

  return { success: true };
}

// ---------- Admin actions (require an admin session) ----------

async function requireAdminSession() {
  return Boolean(await getAdminSession());
}

// A notification is a side effect of the real work, never the point of it —
// a failure here must not fail the action that triggered it.
async function notify(userId: string, body: string, href?: string) {
  try {
    await createNotification({ userId, body, href });
  } catch (error) {
    console.warn("Could not create notification:", error);
  }
}

export async function updateTalentStatus(id: string, status: Talent["status"]) {
  const isAdmin = await requireAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Not authenticated." };
  }

  try {
    await updateTalentRecord(id, { status });
    // Tell the applicant their application moved, if the lead is attributed to
    // an account. Unattributed leads (applied without signing up) get nothing.
    const ownerId = await getTalentRecordUserId(id);
    if (ownerId) {
      await notify(ownerId, `Your application status is now "${status}".`, "/dashboard");
    }
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating talent status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

export async function updateEmployerStatus(id: string, status: Employer["status"]) {
  const isAdmin = await requireAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Not authenticated." };
  }

  try {
    await updateEmployerRecord(id, { status });
    const ownerId = await getEmployerRecordUserId(id);
    if (ownerId) {
      await notify(ownerId, `Your hiring inquiry is now "${status}".`, "/dashboard");
    }
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating employer status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

type MetaPatch = { notes?: string; followUpDate?: string };

// Convert a form patch (strings) into DB values, keeping only provided fields.
function toMetaData(patch: MetaPatch): { notes?: string | null; followUpDate?: Date | null } {
  const data: { notes?: string | null; followUpDate?: Date | null } = {};
  if (patch.notes !== undefined) data.notes = patch.notes.trim() || null;
  if (patch.followUpDate !== undefined) {
    data.followUpDate = patch.followUpDate ? new Date(patch.followUpDate) : null;
  }
  return data;
}

// ---------- Admin: verify talent + move interest status ----------

export async function setTalentVerifiedAction(userId: string, verified: boolean) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Not authenticated." };
  }
  try {
    await setTalentVerified(userId, verified);
    // Only announce the good news. Being unlisted is a quiet admin action —
    // the member sees it reflected on their dashboard either way.
    if (verified) {
      await notify(
        userId,
        "Your profile is verified and now listed in the talent directory.",
        "/dashboard"
      );
    }
    revalidatePath("/admin/directory");
    revalidatePath("/talent");
    return { success: true };
  } catch (error) {
    console.error("Error setting talent verified:", error);
    return { success: false, error: "Failed to update." };
  }
}

export async function updateInterestStatusAction(
  id: string,
  status: "Pending" | "Intro Made" | "Closed"
) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Not authenticated." };
  }
  try {
    // Read the parties before the update — if the row vanishes we skip the
    // notifications rather than guessing who they were for.
    const parties = await getInterestParties(id);
    await updateInterestStatus(id, status);

    // "Intro Made" is the moment the admin has vetted and connected the two —
    // the first point at which each side may know who the other is.
    if (parties && status === "Intro Made") {
      await Promise.all([
        notify(
          parties.talentId,
          `We've introduced you to ${parties.employerName}. Check your email for the intro.`,
          "/dashboard"
        ),
        notify(
          parties.employerId,
          `We've introduced you to ${parties.talentName}. Check your email for the intro.`,
          "/dashboard"
        ),
      ]);
    }

    revalidatePath("/admin/interests");
    return { success: true };
  } catch (error) {
    console.error("Error updating interest status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

// ---------- Marketplace: employer expresses interest in a talent ----------

export async function expressInterest(
  input: unknown
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "employer") {
    return { success: false, error: "Only employer accounts can express interest." };
  }

  const parsed = expressInterestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid request." };
  }
  const { talentId, message } = parsed.data;

  // Only verified, listed talent can be contacted through the directory.
  const talent = await getVerifiedTalentById(talentId);
  if (!talent) {
    return { success: false, error: "That talent is no longer available." };
  }

  if (await hasPendingInterest(user.id, talentId)) {
    return { success: false, error: "You already have a pending interest for this talent." };
  }

  try {
    await createInterest({ employerId: user.id, talentId, message: message?.trim() || null });
  } catch (error) {
    console.error("Error creating interest:", error);
    return { success: false, error: "Could not submit your interest. Please try again." };
  }

  // Tell the talent someone's interested, but deliberately not who. Intros are
  // admin-mediated; naming the employer here would leak a connection before it
  // has been reviewed. The name lands once the status becomes "Intro Made".
  await notify(
    talentId,
    "An employer expressed interest in your profile. We'll be in touch once we've reviewed it.",
    "/dashboard"
  );

  // Notify the admin team (non-critical — the intro is admin-mediated).
  try {
    await sendAdminInterestNotification({
      employerName: user.name ?? user.email ?? "An employer",
      talentName: talent.name,
      message: message?.trim() || null,
    });
  } catch (error) {
    console.warn("Interest notification could not be sent:", error);
  }

  revalidatePath("/admin/interests");
  return { success: true };
}

export async function updateTalentDetails(id: string, patch: MetaPatch) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Not authenticated." };
  }
  try {
    await updateTalentMeta(id, toMetaData(patch));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating talent details:", error);
    return { success: false, error: "Failed to save." };
  }
}

export async function updateEmployerDetails(id: string, patch: MetaPatch) {
  if (!(await requireAdminSession())) {
    return { success: false, error: "Not authenticated." };
  }
  try {
    await updateEmployerMeta(id, toMetaData(patch));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating employer details:", error);
    return { success: false, error: "Failed to save." };
  }
}

export async function submitEmployerInquiry(data: Omit<Employer, "id" | "status" | "createdAt">) {
  // 0. Re-validate on the server — public endpoint, untrusted input.
  const parsed = employerInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid inquiry. Please check your entries and try again." };
  }

  // 0b. Reject rapid duplicate submissions from the same email.
  if (await hasRecentEmployerSubmission(parsed.data.email)) {
    return { success: false, error: "We already received an inquiry from this email. Please wait a few minutes before submitting again." };
  }

  // See submitTalentApplication — public form, so an anonymous submit is normal.
  const submitter = await getCurrentUser();

  try {
    // 1. Create database record (critical — fail if this fails)
    await createEmployerRecord(parsed.data, submitter?.id ?? null);
  } catch (error) {
    console.error("Error saving employer inquiry:", error);
    return { success: false, error: "Failed to submit inquiry. Please try again." };
  }

  // 2. Send emails (non-critical — log but don't fail). Notify the inquirer
  // and the internal team; either failing must not fail the submission.
  const [confirmation, notification] = await Promise.allSettled([
    sendEmployerConfirmationEmail(parsed.data.email, parsed.data.contactName),
    sendAdminEmployerNotification(parsed.data),
  ]);
  if (confirmation.status === "rejected") {
    console.warn("Confirmation email could not be sent:", confirmation.reason);
  }
  if (notification.status === "rejected") {
    console.warn("Admin notification could not be sent:", notification.reason);
  }

  return { success: true };
}
