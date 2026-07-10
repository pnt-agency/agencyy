"use server";

import { createTalentRecord, createEmployerRecord, updateTalentRecord, updateEmployerRecord, hasRecentTalentSubmission, hasRecentEmployerSubmission } from "@/lib/db/queries";
import { sendTalentConfirmationEmail, sendEmployerConfirmationEmail, sendAdminTalentNotification, sendAdminEmployerNotification } from "@/lib/resend";
import { Talent, Employer } from "@/types";
import { getAdminSession } from "@/lib/auth";
import { talentInputSchema, employerInputSchema } from "@/lib/validation";
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
