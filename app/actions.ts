"use server";

import { createTalentRecord, createEmployerRecord } from "@/lib/airtable";
import { sendTalentConfirmationEmail, sendEmployerConfirmationEmail } from "@/lib/resend";
import { Talent, Employer } from "@/types";

export async function submitTalentApplication(data: Omit<Talent, "id" | "status" | "createdAt">) {
  try {
    // 1. Create Airtable Record (critical — fail if this fails)
    await createTalentRecord(data);
  } catch (error) {
    console.error("Error saving talent application to Airtable:", error);
    return { success: false, error: "Failed to submit application. Please try again." };
  }

  // 2. Send Confirmation Email (non-critical — log but don't fail)
  try {
    await sendTalentConfirmationEmail(data.email, data.name);
  } catch (emailError) {
    console.warn("Confirmation email could not be sent:", emailError);
  }

  return { success: true };
}

export async function submitEmployerInquiry(data: Omit<Employer, "id" | "status" | "createdAt">) {
  try {
    // 1. Create Airtable Record (critical — fail if this fails)
    await createEmployerRecord(data);
  } catch (error) {
    console.error("Error saving employer inquiry to Airtable:", error);
    return { success: false, error: "Failed to submit inquiry. Please try again." };
  }

  // 2. Send Confirmation Email (non-critical — log but don't fail)
  try {
    await sendEmployerConfirmationEmail(data.email, data.contactName);
  } catch (emailError) {
    console.warn("Confirmation email could not be sent:", emailError);
  }

  return { success: true };
}
