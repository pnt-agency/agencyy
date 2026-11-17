"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccount, getCurrentAccount, isEmailVerified } from "@/lib/auth";
import { recordAudit, AUDIT_ACTIONS, AUDIT_TARGETS } from "@/lib/audit";
import { checkIpRateLimit, rateLimitMessage, RATE_LIMITS } from "@/lib/rate-limit";
import {
  presignKycUpload,
  presignKycDownload,
  isKycStorageConfigured,
  deleteObject,
  KYC_ID_CONTENT_TYPES,
  KYC_SELFIE_CONTENT_TYPES,
  KYC_MAX_BYTES,
  type KycDocumentKind,
} from "@/lib/r2";
import { kycSubmissionSchema, kycReviewSchema } from "@/lib/validation";
import {
  getTalentKyc,
  upsertTalentKyc,
  reviewTalentKyc,
  getUserById,
  createNotification,
} from "@/lib/db/queries";

type PresignResult =
  | { success: true; url: string; key: string }
  | { success: false; error: string };

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Presigns a KYC document upload for a signed-in, email-verified talent.
 *
 * The same shape as the CV path: the server decides the prefix, the type and
 * the size, and signs them into the URL so R2 enforces them. Nothing passes
 * through our server, which is what keeps a 10MB photo inside the platform's
 * request limits.
 */
export async function presignKycUploadAction(
  kind: KycDocumentKind,
  contentType: string,
  contentLength: number
): Promise<PresignResult> {
  const account = await getCurrentAccount();
  if (!account) return { success: false, error: "You must be signed in." };
  if (account.role !== "talent") {
    return { success: false, error: "Only talent accounts can submit identity documents." };
  }
  if (!isEmailVerified(account)) {
    return { success: false, error: "Verify your email address before submitting identity documents." };
  }
  if (kind !== "id" && kind !== "selfie") {
    return { success: false, error: "Unknown document type." };
  }
  if (!isKycStorageConfigured()) {
    return { success: false, error: "Document uploads aren't available right now." };
  }

  const limit = await checkIpRateLimit(RATE_LIMITS.KYC_PRESIGN);
  if (!limit.allowed) return { success: false, error: rateLimitMessage(limit) };

  const allowed = kind === "id" ? KYC_ID_CONTENT_TYPES : KYC_SELFIE_CONTENT_TYPES;
  if (!allowed[contentType]) {
    return {
      success: false,
      error:
        kind === "id"
          ? "Upload a PDF, JPG, PNG or WebP file."
          : "Upload a JPG, PNG or WebP photo.",
    };
  }
  if (!Number.isInteger(contentLength) || contentLength <= 0) {
    return { success: false, error: "Could not read the file size." };
  }
  if (contentLength > KYC_MAX_BYTES) {
    return { success: false, error: "That file is too large. The limit is 10MB." };
  }

  try {
    const { url, key } = await presignKycUpload(kind, contentType, contentLength);
    return { success: true, url, key };
  } catch (error) {
    console.error("Error presigning KYC upload:", error);
    return { success: false, error: "Could not start the upload. Please try again." };
  }
}

/**
 * Creates or replaces the talent's submission.
 *
 * Replaced documents are deleted from R2 afterwards: a rejected submission
 * would otherwise leave an old ID scan sitting in the bucket forever, and the
 * new row would no longer reference it.
 */
export async function submitKycAction(input: unknown): Promise<ActionResult> {
  const account = await getCurrentAccount();
  if (!account) return { success: false, error: "You must be signed in." };
  if (account.role !== "talent") {
    return { success: false, error: "Only talent accounts can submit identity documents." };
  }
  if (!isEmailVerified(account)) {
    return { success: false, error: "Verify your email address before submitting identity documents." };
  }
  if (!isKycStorageConfigured()) {
    return { success: false, error: "Document uploads aren't available right now." };
  }

  const parsed = kycSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;

  const previous = await getTalentKyc(account.id);

  try {
    await upsertTalentKyc({
      userId: account.id,
      legalName: data.legalName,
      dateOfBirth: data.dateOfBirth,
      country: data.country,
      idType: data.idType,
      idNumber: data.idNumber,
      idDocumentKey: data.idDocument.key,
      idDocumentFilename: data.idDocument.filename,
      idDocumentContentType: data.idDocument.contentType,
      idDocumentSize: data.idDocument.size,
      selfieKey: data.selfie.key,
      selfieFilename: data.selfie.filename,
      selfieContentType: data.selfie.contentType,
      selfieSize: data.selfie.size,
      status: "Pending",
      method: "manual",
    });
  } catch (error) {
    console.error("Error saving KYC submission:", error);
    return { success: false, error: "Could not save your submission. Please try again." };
  }

  // Best-effort: a failed delete costs storage, not correctness, and the row no
  // longer points at these objects either way.
  if (previous) {
    const replaced = new Set([data.idDocument.key, data.selfie.key]);
    for (const key of [previous.idDocumentKey, previous.selfieKey]) {
      if (!replaced.has(key)) {
        await deleteObject(key).catch((error) =>
          console.error("Could not delete replaced KYC document:", error)
        );
      }
    }
  }

  revalidatePath("/kyc");
  revalidatePath("/dashboard");
  revalidatePath("/admin/kyc");
  return { success: true };
}

/** Approve or reject a submission. Admin only; both outcomes are audited. */
export async function reviewKycAction(input: unknown): Promise<ActionResult> {
  const admin = await getAdminAccount();
  if (!admin) return { success: false, error: "Not authenticated." };

  const parsed = kycReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }
  const { userId, decision, note } = parsed.data;

  const target = await getUserById(userId);
  if (!target || target.role !== "talent") {
    return { success: false, error: "That talent no longer exists." };
  }
  const submission = await getTalentKyc(userId);
  if (!submission) return { success: false, error: "No identity submission on file." };

  const status = decision === "approve" ? "Approved" : "Rejected";
  const cleanNote = note?.trim() || null;

  try {
    await reviewTalentKyc(userId, status, admin.id, cleanNote);
  } catch (error) {
    console.error("Error reviewing KYC submission:", error);
    return { success: false, error: "Could not save the review. Please try again." };
  }

  await recordAudit({
    actor: admin,
    action: decision === "approve" ? AUDIT_ACTIONS.KYC_APPROVED : AUDIT_ACTIONS.KYC_REJECTED,
    targetType: AUDIT_TARGETS.KYC,
    targetId: submission.id,
    before: { status: submission.status },
    after: { status, note: cleanNote },
  });

  await createNotification({
    userId,
    body:
      status === "Approved"
        ? "Your identity has been verified. Your profile now shows an ID verified badge."
        : `We couldn't verify your ID yet. ${cleanNote ?? "Please resubmit clearer documents."}`,
    href: "/kyc",
  });

  revalidatePath("/admin/kyc");
  revalidatePath("/admin/directory");
  revalidatePath("/talent");
  revalidatePath(`/talent/${userId}`);
  revalidatePath("/kyc");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Short-lived download link for one identity document. Admin only, and logged
 * on every click: this is the most sensitive data the application stores.
 */
export async function getKycDocumentUrlAction(
  userId: string,
  kind: KycDocumentKind
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const admin = await getAdminAccount();
  if (!admin) return { success: false, error: "Not authenticated." };
  if (kind !== "id" && kind !== "selfie") {
    return { success: false, error: "Unknown document type." };
  }

  const submission = await getTalentKyc(userId);
  if (!submission) return { success: false, error: "No identity submission on file." };

  const key = kind === "id" ? submission.idDocumentKey : submission.selfieKey;
  const filename = kind === "id" ? submission.idDocumentFilename : submission.selfieFilename;

  try {
    const url = await presignKycDownload(key, filename);
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.KYC_DOCUMENT_VIEW,
      targetType: AUDIT_TARGETS.KYC,
      targetId: submission.id,
      after: { kind, filename },
    });
    return { success: true, url };
  } catch (error) {
    console.error("Error presigning KYC download:", error);
    return { success: false, error: "Could not prepare the download." };
  }
}
