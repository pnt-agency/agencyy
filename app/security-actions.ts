"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentAccount, isEmailVerified } from "@/lib/auth";
import type { UserRow } from "@/lib/db/schema";
import { setTwoStepEnabled, deleteAuthTokensFor } from "@/lib/db/queries";
import { issueTwoStepCode, verifyTwoStepCode, SETUP_CODE, SIGN_IN_CODE } from "@/lib/two-step";
import { checkRateLimit, rateLimitMessage, RATE_LIMITS } from "@/lib/rate-limit";
import { sendSecurityNoticeEmail, type SecurityNotice } from "@/lib/resend";
import { appBaseUrl } from "@/lib/tokens";

/**
 * Account-page actions for two-step verification. The sign-in half lives in
 * the credentials provider (lib/auth.ts); see lib/two-step.ts for the design.
 */

type ActionResult = { success: true } | { success: false; error: string };

const TOO_MANY_CODES = "Too many codes requested. Please wait a few minutes and try again.";

/**
 * The signed-in account, if two-step is something it can use at all. It needs
 * a password (the thing a code is a second step after) and a verified address
 * (the place codes go — an unverified one might not even be theirs).
 */
async function twoStepCapableAccount(): Promise<{ account: UserRow } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Please sign in again." };
  if (!account.passwordHash) {
    return { error: "You sign in with Google, so two-step verification is managed in your Google Account." };
  }
  if (!isEmailVerified(account)) {
    return { error: "Verify your email address first — that's where your codes will be sent." };
  }
  return { account };
}

/** Best-effort: a notice that fails to send must not undo a change that succeeded. */
async function notify(account: UserRow, notice: SecurityNotice): Promise<void> {
  try {
    await sendSecurityNoticeEmail(account.email, account.name, notice, `${appBaseUrl()}/account#security`);
  } catch (error) {
    console.warn(`Security notice (${notice}) could not be sent:`, error);
  }
}

/** Step 1 of turning two-step on: email a code, proving the inbox works. */
export async function startTwoStepSetup(): Promise<ActionResult> {
  const result = await twoStepCapableAccount();
  if ("error" in result) return { success: false, error: result.error };
  const { account } = result;
  if (account.twoStepEnabledAt) return { success: false, error: "Two-step verification is already on." };

  const issued = await issueTwoStepCode(account, SETUP_CODE);
  if (issued === "rate_limited") return { success: false, error: TOO_MANY_CODES };
  if (issued === "send_failed") {
    return { success: false, error: "We couldn't send the code. Please try again shortly." };
  }
  return { success: true };
}

const confirmSchema = z.object({ code: z.string().max(20) });

/** Step 2: the code came back, so the address receives mail. Switch it on. */
export async function confirmTwoStepSetup(input: unknown): Promise<ActionResult> {
  const result = await twoStepCapableAccount();
  if ("error" in result) return { success: false, error: result.error };
  const { account } = result;
  if (account.twoStepEnabledAt) return { success: true };

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter the 6-digit code from the email." };

  const verified = await verifyTwoStepCode(account.id, SETUP_CODE, parsed.data.code);
  if (verified === "rate_limited") {
    return { success: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }
  if (verified !== "ok") return { success: false, error: "That code is incorrect or has expired." };

  await setTwoStepEnabled(account.id, new Date());
  await notify(account, "two-step-on");
  revalidatePath("/account");
  return { success: true };
}

const turnOffSchema = z.object({ password: z.string().min(1).max(200) });

/**
 * Turns two-step off. Asks for the password again: a session left signed in on
 * a shared computer shouldn't be enough to strip the second factor.
 */
export async function turnOffTwoStep(input: unknown): Promise<ActionResult> {
  const account = await getCurrentAccount();
  if (!account) return { success: false, error: "Please sign in again." };
  if (!account.twoStepEnabledAt || !account.passwordHash) return { success: true };

  const parsed = turnOffSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter your password to continue." };

  const limit = await checkRateLimit(RATE_LIMITS.PASSWORD_CONFIRM, account.id);
  if (!limit.allowed) return { success: false, error: rateLimitMessage(limit) };

  if (!(await bcrypt.compare(parsed.data.password, account.passwordHash))) {
    return { success: false, error: "That password isn't right." };
  }

  await setTwoStepEnabled(account.id, null);
  // Any sign-in code still in flight is now meaningless; don't leave it live.
  await deleteAuthTokensFor(account.id, SIGN_IN_CODE);
  await notify(account, "two-step-off");
  revalidatePath("/account");
  return { success: true };
}
