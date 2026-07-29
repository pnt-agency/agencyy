import { headers } from "next/headers";
import { insertAuditLog } from "./db/queries";
import type { UserRow } from "./db/schema";

/**
 * Every auditable admin action, as `subject.verb` strings. Centralised so the
 * viewer's filter list and the call sites can't drift apart, and so renaming an
 * action is a compile error rather than a silent hole in the log.
 */
export const AUDIT_ACTIONS = {
  TALENT_STATUS_SET: "talent.status.set",
  TALENT_DETAILS_UPDATE: "talent.details.update",
  EMPLOYER_STATUS_SET: "employer.status.set",
  EMPLOYER_DETAILS_UPDATE: "employer.details.update",
  PROFILE_VERIFIED_SET: "profile.verified.set",
  USER_ROLE_SET: "user.role.set",
  INTEREST_STATUS_SET: "interest.status.set",
  DATA_EXPORT: "data.export",
  // Reading an applicant's CV is PII access, so it's logged like a mutation.
  CV_DOWNLOAD: "talent.cv.download",
  TRAINING_VIDEO_SET: "training.video.set",
  TRAINING_MODULE_PUBLISHED: "training.module.published",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_TARGETS = {
  TALENT: "talent",
  EMPLOYER: "employer",
  USER: "user",
  INTEREST: "interest",
  DATASET: "dataset",
  TRAINING_MODULE: "training_module",
} as const;

export type AuditTarget = (typeof AUDIT_TARGETS)[keyof typeof AUDIT_TARGETS];

type AuditEntry = {
  actor: UserRow;
  action: AuditAction;
  targetType: AuditTarget;
  /** Null for actions that aren't about one row, like a bulk export. */
  targetId?: string | null;
  /** Only the fields that changed — see the schema comment on `before`. */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

// Vercel puts the client address in x-forwarded-for as a comma-separated chain;
// the first entry is the original client.
async function requestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ip: forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
      userAgent: h.get("user-agent"),
    };
  } catch {
    // Outside a request scope (a script, a background job) there are no headers
    // to read. Worth logging the action anyway, just without the context.
    return { ip: null, userAgent: null };
  }
}

/**
 * Writes one audit entry. Call it *after* the mutation succeeds.
 *
 * A failure here is logged loudly but never thrown: the mutation has already
 * happened by this point, so throwing would report failure for work that
 * actually succeeded — which corrupts the caller's view of reality to protect
 * a record of it. The tradeoff is that a database problem could lose an entry;
 * an alert on this console.error is the intended backstop.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const { ip, userAgent } = await requestContext();
    await insertAuditLog({
      actorId: entry.actor.id,
      actorEmail: entry.actor.email,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("AUDIT WRITE FAILED", {
      action: entry.action,
      targetId: entry.targetId,
      actor: entry.actor.email,
      error,
    });
  }
}
