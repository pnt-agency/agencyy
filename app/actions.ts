"use server";

import { createTalentRecord, createEmployerRecord, updateTalentRecord, updateEmployerRecord, updateTalentMeta, updateEmployerMeta, hasRecentTalentSubmission, hasRecentEmployerSubmission, getVerifiedTalentById, hasPendingInterest, createInterest, setTalentVerified, updateInterestStatus } from "@/lib/db/queries";
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

  try {
    // 1. Create database record (critical — fail if this fails)
    await createTalentRecord(parsed.data);
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

export async function updateTalentStatus(id: string, status: Talent["status"]) {
  const isAdmin = await requireAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Not authenticated." };
  }

  try {
    await updateTalentRecord(id, { status });
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
    await updateInterestStatus(id, status);
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

  try {
    // 1. Create database record (critical — fail if this fails)
    await createEmployerRecord(parsed.data);
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
