"use server";

import { createTalentRecord, createEmployerRecord, updateTalentRecord, updateEmployerRecord, updateTalentMeta, updateEmployerMeta, hasRecentTalentSubmission, hasRecentEmployerSubmission, getVerifiedTalentById, hasPendingInterest, createInterest, setTalentVerified, updateInterestStatus, createNotification, getInterestParties, getTalentRecordUserId, getEmployerRecordUserId, getUserById, setUserRole, countAdmins, getTalentRecord, getEmployerRecord, getTalentProfile, getInterestById, listTalentRecords, listEmployerRecords } from "@/lib/db/queries";
import { sendTalentConfirmationEmail, sendEmployerConfirmationEmail, sendAdminTalentNotification, sendAdminEmployerNotification, sendAdminInterestNotification } from "@/lib/resend";
import { Talent, Employer } from "@/types";
import { getAdminAccount, getCurrentUser } from "@/lib/auth";
import { recordAudit, AUDIT_ACTIONS, AUDIT_TARGETS } from "@/lib/audit";
import { talentInputSchema, employerInputSchema, expressInterestSchema } from "@/lib/validation";
import { isAssignableAccountRole } from "@/lib/roles";
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

// Returns the acting admin rather than a boolean: every mutation below writes
// an audit entry, and an action that can't name its actor can't be audited.
async function requireAdminSession() {
  return getAdminAccount();
}

const NOT_AUTHENTICATED = { success: false as const, error: "Not authenticated." };

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
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  // Read the prior value before mutating so the audit entry can show the
  // transition, not just the destination.
  const before = await getTalentRecord(id);

  try {
    await updateTalentRecord(id, { status });
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.TALENT_STATUS_SET,
      targetType: AUDIT_TARGETS.TALENT,
      targetId: id,
      before: { status: before?.status ?? null },
      after: { status },
    });
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
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  const before = await getEmployerRecord(id);

  try {
    await updateEmployerRecord(id, { status });
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.EMPLOYER_STATUS_SET,
      targetType: AUDIT_TARGETS.EMPLOYER,
      targetId: id,
      before: { status: before?.status ?? null },
      after: { status },
    });
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

type MetaData = ReturnType<typeof toMetaData>;

// Dates don't survive a jsonb round-trip as Date objects, so normalise them to
// ISO strings before they're stored.
function serializeMeta(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/** The submitted values, shaped for storage. */
function auditableMeta(data: MetaData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ("notes" in data) out.notes = data.notes ?? null;
  if ("followUpDate" in data) out.followUpDate = serializeMeta(data.followUpDate);
  return out;
}

/**
 * The prior values of exactly the fields this patch touches. Recording the
 * whole row instead would copy the lead's PII into the audit table, which is
 * one place we never scrub.
 */
function changedFields(
  before: { notes: string | null; followUpDate: Date | null } | null,
  data: MetaData
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ("notes" in data) out.notes = before?.notes ?? null;
  if ("followUpDate" in data) out.followUpDate = serializeMeta(before?.followUpDate);
  return out;
}

// ---------- Admin: verify talent + move interest status ----------

export async function setTalentVerifiedAction(userId: string, verified: boolean) {
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  // No profile row yet means the upsert below creates one — record that as a
  // transition from unverified rather than from nothing.
  const before = await getTalentProfile(userId);

  try {
    await setTalentVerified(userId, verified);
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.PROFILE_VERIFIED_SET,
      targetType: AUDIT_TARGETS.USER,
      targetId: userId,
      before: { verified: before?.verified ?? false },
      after: { verified },
    });
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

/**
 * Promote or demote another account. Admin-only, and deliberately refuses two
 * changes that have no recovery path through the UI: changing your own role,
 * and demoting the last remaining admin. Either would leave the platform with
 * nobody able to reach /admin, fixable only with direct database access.
 */
export async function setUserRoleAction(userId: string, role: string) {
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  // Whitelist rather than trusting the submitted string — this is a privilege
  // boundary, and "user" is transient state the signup flow owns, not a role
  // an admin hands out.
  if (!isAssignableAccountRole(role)) {
    return { success: false, error: "Unsupported role." };
  }

  const target = await getUserById(userId);
  if (!target) {
    return { success: false, error: "Account not found." };
  }

  // Both sides now come from the database, so a plain id comparison is enough —
  // this no longer depends on the session carrying an id claim.
  if (target.id === admin.id) {
    return { success: false, error: "You cannot change your own role." };
  }

  if (target.role === role) {
    return { success: true };
  }

  if (target.role === "admin" && (await countAdmins()) <= 1) {
    return { success: false, error: "This is the last admin account." };
  }

  try {
    await setUserRole(userId, role);
    // The privilege boundary — the single most important entry in this log.
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.USER_ROLE_SET,
      targetType: AUDIT_TARGETS.USER,
      targetId: userId,
      before: { role: target.role },
      after: { role },
    });
    await notify(
      userId,
      role === "admin"
        ? "You now have admin access."
        : `An admin changed your account type to "${role}".`,
      role === "admin" ? "/admin" : "/dashboard"
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/directory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error setting user role:", error);
    return { success: false, error: "Failed to update role." };
  }
}

export async function updateInterestStatusAction(
  id: string,
  status: "Pending" | "Intro Made" | "Closed"
) {
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  const before = await getInterestById(id);

  try {
    // Read the parties before the update — if the row vanishes we skip the
    // notifications rather than guessing who they were for.
    const parties = await getInterestParties(id);
    await updateInterestStatus(id, status);
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.INTEREST_STATUS_SET,
      targetType: AUDIT_TARGETS.INTEREST,
      targetId: id,
      before: { status: before?.status ?? null },
      after: { status },
    });

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
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  const before = await getTalentRecord(id);

  try {
    const data = toMetaData(patch);
    await updateTalentMeta(id, data);
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.TALENT_DETAILS_UPDATE,
      targetType: AUDIT_TARGETS.TALENT,
      targetId: id,
      // Scoped to the keys this patch actually carried — an edit to the notes
      // shouldn't imply anything about the follow-up date.
      before: changedFields(before, data),
      after: auditableMeta(data),
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating talent details:", error);
    return { success: false, error: "Failed to save." };
  }
}

export async function updateEmployerDetails(id: string, patch: MetaPatch) {
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  const before = await getEmployerRecord(id);

  try {
    const data = toMetaData(patch);
    await updateEmployerMeta(id, data);
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.EMPLOYER_DETAILS_UPDATE,
      targetType: AUDIT_TARGETS.EMPLOYER,
      targetId: id,
      before: changedFields(before, data),
      after: auditableMeta(data),
    });
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

// ---------- Admin: data export ----------

// Serialize a single CSV cell: wrap in quotes and double any embedded quotes so
// commas, newlines, and quotes in free-text fields (bio, notes) can't break the row.
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

/**
 * Builds the CSV export server-side.
 *
 * This used to happen entirely in the browser from rows already embedded in the
 * admin page, which meant the single largest PII disclosure this app performs —
 * every applicant's name, email, phone and CV link — left no trace anywhere.
 * Running it through an action gives it an actor, a timestamp and a log entry.
 */
export async function exportAdminDataAction() {
  const admin = await requireAdminSession();
  if (!admin) return NOT_AUTHENTICATED;

  try {
    const [talentRows, employerRows] = await Promise.all([
      listTalentRecords(),
      listEmployerRecords(),
    ]);

    const talentCsv = toCsv(
      ["Name", "Email", "Phone", "Country", "Role", "Experience", "Portfolio", "CV Link", "Status", "Follow-up", "Notes", "Created"],
      talentRows.map((t) => [
        t.name, t.email, t.phone, t.country, t.role, t.experience,
        t.portfolio, t.cvLink, t.status, t.followUpDate, t.notes, t.createdAt,
      ])
    );

    const employerCsv = toCsv(
      ["Company", "Contact", "Email", "Phone", "Country", "Role Needed", "Number Needed", "Budget", "Start Date", "Requirements", "Status", "Follow-up", "Notes", "Created"],
      employerRows.map((e) => [
        e.companyName, e.contactName, e.email, e.phone, e.country, e.roleNeeded,
        e.numberNeeded, e.budget, e.startDate, e.requirements, e.status,
        e.followUpDate, e.notes, e.createdAt,
      ])
    );

    // Row counts, not contents — the log records that a dump happened and how
    // much of it, without becoming a second copy of the data.
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.DATA_EXPORT,
      targetType: AUDIT_TARGETS.DATASET,
      targetId: null,
      after: { talents: talentRows.length, employers: employerRows.length },
    });

    return { success: true as const, talentCsv, employerCsv };
  } catch (error) {
    console.error("Error exporting admin data:", error);
    return { success: false as const, error: "Failed to export data." };
  }
}
