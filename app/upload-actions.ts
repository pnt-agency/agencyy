"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccount, getCurrentUser } from "@/lib/auth";
import { recordAudit, AUDIT_ACTIONS, AUDIT_TARGETS } from "@/lib/audit";
import {
  presignCvUpload,
  presignVideoUpload,
  presignCvDownload,
  isCvStorageConfigured,
  isVideoStorageConfigured,
  deleteObject,
  CV_MAX_BYTES,
  VIDEO_MAX_BYTES,
  CV_CONTENT_TYPES,
  VIDEO_CONTENT_TYPES,
} from "@/lib/r2";
import {
  getTalentRecord,
  getTrainingModule,
  updateTrainingModule,
  markTrainingProgress,
  listTrainingModules,
  listTrainingProgress,
} from "@/lib/db/queries";

type PresignResult =
  | { success: true; url: string; key: string }
  | { success: false; error: string };

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Shared guard for both presign paths.
 *
 * Everything a browser can influence about the upload — type and size — is
 * checked here and then *signed into* the URL, so the constraint is enforced by
 * R2 rather than by the client's good behaviour. What we can't check is the
 * bytes themselves: nothing passes through our server. That's handled at the
 * other end instead, by serving CVs only as attachments (see presignCvDownload).
 */
function validateUpload(
  contentType: string,
  contentLength: number,
  allowed: Record<string, string>,
  maxBytes: number,
  label: string
): string | null {
  if (!allowed[contentType]) {
    const kinds = Object.values(allowed).join(", ").toUpperCase();
    return `Unsupported file type. Please upload a ${kinds} file.`;
  }
  if (!Number.isInteger(contentLength) || contentLength <= 0) {
    return "Could not read the file size.";
  }
  if (contentLength > maxBytes) {
    return `That ${label} is too large. The limit is ${Math.floor(maxBytes / 1024 / 1024)}MB.`;
  }
  return null;
}

/**
 * Presigns a CV upload for the public apply form.
 *
 * Deliberately unauthenticated — people apply before they have an account. The
 * exposure is bounded by what's signed in: a single object, of a pinned type
 * and exact size, under a key the server chose, valid for five minutes.
 */
export async function presignCvUploadAction(
  contentType: string,
  contentLength: number
): Promise<PresignResult> {
  if (!isCvStorageConfigured()) {
    return { success: false, error: "File uploads aren't available right now." };
  }
  const problem = validateUpload(contentType, contentLength, CV_CONTENT_TYPES, CV_MAX_BYTES, "CV");
  if (problem) return { success: false, error: problem };

  try {
    const { url, key } = await presignCvUpload(contentType, contentLength);
    return { success: true, url, key };
  } catch (error) {
    console.error("Error presigning CV upload:", error);
    return { success: false, error: "Could not start the upload. Please try again." };
  }
}

/** Presigns a training video upload. Admins only. */
export async function presignVideoUploadAction(
  contentType: string,
  contentLength: number
): Promise<PresignResult> {
  const admin = await getAdminAccount();
  if (!admin) return { success: false, error: "Not authenticated." };
  if (!isVideoStorageConfigured()) {
    return { success: false, error: "Video storage isn't configured." };
  }
  const problem = validateUpload(
    contentType,
    contentLength,
    VIDEO_CONTENT_TYPES,
    VIDEO_MAX_BYTES,
    "video"
  );
  if (problem) return { success: false, error: problem };

  try {
    const { url, key } = await presignVideoUpload(contentType, contentLength);
    return { success: true, url, key };
  } catch (error) {
    console.error("Error presigning video upload:", error);
    return { success: false, error: "Could not start the upload. Please try again." };
  }
}

/**
 * Attaches an uploaded video to a module, once the browser has finished PUTting
 * it. Replacing a video deletes the object it replaced, so abandoned files
 * don't accumulate in the bucket.
 */
export async function attachModuleVideoAction(
  moduleId: string,
  key: string,
  durationSeconds: number
): Promise<ActionResult> {
  const admin = await getAdminAccount();
  if (!admin) return { success: false, error: "Not authenticated." };

  const trainingModule = await getTrainingModule(moduleId);
  if (!trainingModule) return { success: false, error: "Module not found." };

  try {
    await updateTrainingModule(moduleId, {
      videoKey: key,
      videoDurationSeconds: Math.round(durationSeconds) || null,
    });
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.TRAINING_VIDEO_SET,
      targetType: AUDIT_TARGETS.TRAINING_MODULE,
      targetId: moduleId,
      before: { videoKey: trainingModule.videoKey },
      after: { videoKey: key },
    });

    if (trainingModule.videoKey && trainingModule.videoKey !== key) {
      // Best-effort: an orphaned object costs pennies, a failed action costs
      // the admin their work.
      try {
        await deleteObject("public", trainingModule.videoKey);
      } catch (error) {
        console.warn("Could not delete replaced training video:", error);
      }
    }

    revalidatePath("/admin/training");
    revalidatePath("/training");
    return { success: true };
  } catch (error) {
    console.error("Error attaching module video:", error);
    return { success: false, error: "Could not save the video. Please try again." };
  }
}

/** Publishes or unpublishes a module — controls whether members see it. */
export async function setModulePublishedAction(
  moduleId: string,
  published: boolean
): Promise<ActionResult> {
  const admin = await getAdminAccount();
  if (!admin) return { success: false, error: "Not authenticated." };

  const trainingModule = await getTrainingModule(moduleId);
  if (!trainingModule) return { success: false, error: "Module not found." };

  // Publishing a module with no video would recreate exactly the bug this
  // replaced: a player pointed at nothing, and a quiz that can never unlock.
  if (published && !trainingModule.videoKey) {
    return { success: false, error: "Upload a video before publishing this module." };
  }

  try {
    await updateTrainingModule(moduleId, { published });
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.TRAINING_MODULE_PUBLISHED,
      targetType: AUDIT_TARGETS.TRAINING_MODULE,
      targetId: moduleId,
      before: { published: trainingModule.published },
      after: { published },
    });
    revalidatePath("/admin/training");
    revalidatePath("/training");
    return { success: true };
  } catch (error) {
    console.error("Error publishing module:", error);
    return { success: false, error: "Could not update the module." };
  }
}

/**
 * Issues a 60-second download link for a stored CV, and logs it.
 *
 * Reading someone's CV is the most sensitive thing an admin can do in this app,
 * so it's audited like a mutation — the log is how you answer "who downloaded
 * this applicant's file".
 */
export async function getCvDownloadUrlAction(
  talentId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const admin = await getAdminAccount();
  if (!admin) return { success: false, error: "Not authenticated." };

  const talent = await getTalentRecord(talentId);
  if (!talent?.cvKey) return { success: false, error: "No CV on file." };

  try {
    const url = await presignCvDownload(talent.cvKey, talent.cvFilename ?? "cv.pdf");
    await recordAudit({
      actor: admin,
      action: AUDIT_ACTIONS.CV_DOWNLOAD,
      targetType: AUDIT_TARGETS.TALENT,
      targetId: talentId,
      after: { filename: talent.cvFilename },
    });
    return { success: true, url };
  } catch (error) {
    console.error("Error presigning CV download:", error);
    return { success: false, error: "Could not prepare the download." };
  }
}

// ---------- Member training progress ----------

/**
 * Records that the member finished a module's video, or its quiz.
 *
 * Server-side because the old localStorage version was per-browser, lost on a
 * device change, and editable from devtools. The `completed` step re-checks
 * that the video was watched: the UI disables the button, but a Server Action
 * is a public endpoint and the ordering is the whole point of the gate.
 */
export async function recordTrainingProgressAction(
  moduleId: string,
  step: "watched" | "completed"
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.id) return { success: false, error: "You must be signed in." };

  const trainingModule = await getTrainingModule(moduleId);
  if (!trainingModule?.published) return { success: false, error: "Module not available." };

  try {
    if (step === "completed") {
      const [modules, progress] = await Promise.all([
        listTrainingModules(true),
        listTrainingProgress(user.id),
      ]);
      const watched = progress.find((p) => p.moduleId === moduleId)?.watchedAt;
      if (!watched) {
        return { success: false, error: "Watch the video before submitting the quiz." };
      }
      // Modules unlock in order, so completing one out of sequence would skip
      // the curriculum entirely.
      const index = modules.findIndex((m) => m.id === moduleId);
      const previous = index > 0 ? modules[index - 1] : null;
      if (previous) {
        const previousDone = progress.find((p) => p.moduleId === previous.id)?.completedAt;
        if (!previousDone) {
          return { success: false, error: "Complete the previous module first." };
        }
      }
    }

    await markTrainingProgress(user.id, moduleId, step === "watched" ? "watchedAt" : "completedAt");
    revalidatePath("/training");
    return { success: true };
  } catch (error) {
    console.error("Error recording training progress:", error);
    return { success: false, error: "Could not save your progress." };
  }
}
