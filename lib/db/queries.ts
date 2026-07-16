import { eq, desc, and, or, gte, count, sql, ilike, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from ".";
import {
  talents,
  employers,
  users,
  talentProfiles,
  employerProfiles,
  authTokens,
  talentInterests,
  notifications,
  type TalentRow,
  type EmployerRow,
  type UserRow,
  type TalentProfileRow,
  type EmployerProfileRow,
  type AuthTokenRow,
  type TalentInterestRow,
  type NotificationRow,
} from "./schema";
import type { Talent, Employer } from "@/types";

// Reject repeat submissions from the same email inside this window. This is a
// lightweight anti-double-submit / anti-burst guard, not a full IP rate limiter.
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

// ---------- Talent ----------

export async function createTalentRecord(
  data: Omit<Talent, "id" | "status" | "createdAt">,
  userId: string | null = null
): Promise<TalentRow> {
  const [record] = await db
    .insert(talents)
    .values({
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      role: data.role,
      experience: data.experience,
      portfolio: data.portfolio || null,
      bio: data.bio,
      whyJoin: data.whyJoin,
      cvLink: data.cvLink || null,
      status: "Applicant",
    })
    .returning();

  return record;
}

export async function hasRecentTalentSubmission(email: string): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const [row] = await db
    .select({ id: talents.id })
    .from(talents)
    .where(and(eq(talents.email, email), gte(talents.createdAt, since)))
    .limit(1);
  return Boolean(row);
}

export async function listTalentRecords(): Promise<TalentRow[]> {
  return db.select().from(talents).orderBy(desc(talents.createdAt));
}

export async function getTalentRecord(id: string): Promise<TalentRow | null> {
  const [record] = await db.select().from(talents).where(eq(talents.id, id));
  return record ?? null;
}

export async function updateTalentRecord(
  id: string,
  data: Partial<Omit<Talent, "id" | "createdAt">>
): Promise<TalentRow | null> {
  const [record] = await db
    .update(talents)
    .set({
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    })
    .where(eq(talents.id, id))
    .returning();

  return record ?? null;
}

// ---------- Employer ----------

export async function createEmployerRecord(
  data: Omit<Employer, "id" | "status" | "createdAt">,
  userId: string | null = null
): Promise<EmployerRow> {
  const [record] = await db
    .insert(employers)
    .values({
      userId,
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      roleNeeded: data.roleNeeded,
      numberNeeded: data.numberNeeded,
      budget: data.budget,
      startDate: data.startDate,
      requirements: data.requirements || null,
      status: "New Inquiry",
    })
    .returning();

  return record;
}

export async function hasRecentEmployerSubmission(email: string): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const [row] = await db
    .select({ id: employers.id })
    .from(employers)
    .where(and(eq(employers.email, email), gte(employers.createdAt, since)))
    .limit(1);
  return Boolean(row);
}

export async function listEmployerRecords(): Promise<EmployerRow[]> {
  return db.select().from(employers).orderBy(desc(employers.createdAt));
}

// Admin CRM: update just the notes and/or follow-up date on a lead. Only the
// keys present in `data` are written, so callers can update either field alone.
export async function updateTalentMeta(
  id: string,
  data: { notes?: string | null; followUpDate?: Date | null }
): Promise<TalentRow | null> {
  const set: Partial<TalentRow> = {};
  if ("notes" in data) set.notes = data.notes ?? null;
  if ("followUpDate" in data) set.followUpDate = data.followUpDate ?? null;
  if (Object.keys(set).length === 0) return null;
  const [record] = await db.update(talents).set(set).where(eq(talents.id, id)).returning();
  return record ?? null;
}

export async function updateEmployerMeta(
  id: string,
  data: { notes?: string | null; followUpDate?: Date | null }
): Promise<EmployerRow | null> {
  const set: Partial<EmployerRow> = {};
  if ("notes" in data) set.notes = data.notes ?? null;
  if ("followUpDate" in data) set.followUpDate = data.followUpDate ?? null;
  if (Object.keys(set).length === 0) return null;
  const [record] = await db.update(employers).set(set).where(eq(employers.id, id)).returning();
  return record ?? null;
}

export async function getEmployerRecord(id: string): Promise<EmployerRow | null> {
  const [record] = await db.select().from(employers).where(eq(employers.id, id));
  return record ?? null;
}

export async function updateEmployerRecord(
  id: string,
  data: Partial<Omit<Employer, "id" | "createdAt">>
): Promise<EmployerRow | null> {
  const [record] = await db
    .update(employers)
    .set({
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    })
    .where(eq(employers.id, id))
    .returning();

  return record ?? null;
}

// ---------- Users & member profiles ----------

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()));
  return user ?? null;
}

// A member's own leads are found by FK first, falling back to a case-insensitive
// email match. The fallback still matters: someone can apply at /apply while
// logged out and only make an account afterwards. claimLeadsForUser() converts
// those matches into real FKs, but this OR keeps the count right in the window
// before it runs — and for leads submitted under an unverified alias email.
export async function countTalentApplicationsForUser(
  userId: string,
  email: string
): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({ value: count() })
    .from(talents)
    .where(
      or(eq(talents.userId, userId), sql`lower(${talents.email}) = ${normalized}`)
    );
  return row?.value ?? 0;
}

export async function countEmployerInquiriesForUser(
  userId: string,
  email: string
): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({ value: count() })
    .from(employers)
    .where(
      or(eq(employers.userId, userId), sql`lower(${employers.email}) = ${normalized}`)
    );
  return row?.value ?? 0;
}

// Attach any unclaimed leads sharing this email to the account. Called when an
// account is created and again when its email is verified, so a lead submitted
// before signup still shows on the dashboard. Only touches rows where user_id
// is null — never steals a lead already attributed to someone else.
export async function claimLeadsForUser(userId: string, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await Promise.all([
    db
      .update(talents)
      .set({ userId })
      .where(
        and(isNull(talents.userId), sql`lower(${talents.email}) = ${normalized}`)
      ),
    db
      .update(employers)
      .set({ userId })
      .where(
        and(isNull(employers.userId), sql`lower(${employers.email}) = ${normalized}`)
      ),
  ]);
}

// The account a lead belongs to, for notifying them of CRM status changes.
export async function getTalentRecordUserId(id: string): Promise<string | null> {
  const [row] = await db.select({ userId: talents.userId }).from(talents).where(eq(talents.id, id));
  return row?.userId ?? null;
}

export async function getEmployerRecordUserId(id: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: employers.userId })
    .from(employers)
    .where(eq(employers.id, id));
  return row?.userId ?? null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}): Promise<UserRow> {
  const [user] = await db
    .insert(users)
    .values({ ...data, email: data.email.trim().toLowerCase() })
    .returning();
  return user;
}

export async function setUserPassword(userId: string, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function markEmailVerified(userId: string): Promise<void> {
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
}

// ---------- Auth tokens (email verification / password reset) ----------

export async function createAuthToken(data: {
  userId: string;
  tokenHash: string;
  purpose: string;
  expiresAt: Date;
}): Promise<void> {
  // One live token per (user, purpose): drop any prior ones first.
  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, data.userId), eq(authTokens.purpose, data.purpose)));
  await db.insert(authTokens).values(data);
}

export async function findValidAuthToken(
  tokenHash: string,
  purpose: string
): Promise<AuthTokenRow | null> {
  const [token] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.purpose, purpose),
        gte(authTokens.expiresAt, new Date())
      )
    );
  return token ?? null;
}

export async function deleteAuthToken(id: string): Promise<void> {
  await db.delete(authTokens).where(eq(authTokens.id, id));
}

export async function getTalentProfile(
  userId: string
): Promise<TalentProfileRow | null> {
  const [profile] = await db
    .select()
    .from(talentProfiles)
    .where(eq(talentProfiles.userId, userId));
  return profile ?? null;
}

export async function upsertTalentProfile(
  userId: string,
  data: Partial<Omit<TalentProfileRow, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<TalentProfileRow> {
  const [profile] = await db
    .insert(talentProfiles)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: talentProfiles.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return profile;
}

export async function getEmployerProfile(
  userId: string
): Promise<EmployerProfileRow | null> {
  const [profile] = await db
    .select()
    .from(employerProfiles)
    .where(eq(employerProfiles.userId, userId));
  return profile ?? null;
}

export async function upsertEmployerProfile(
  userId: string,
  data: Partial<Omit<EmployerProfileRow, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<EmployerProfileRow> {
  const [profile] = await db
    .insert(employerProfiles)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: employerProfiles.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return profile;
}

// ---------- Talent directory (marketplace) ----------

// Public directory shape — deliberately excludes email/phone (admin-mediated).
export type DirectoryTalent = {
  userId: string;
  name: string;
  role: string | null;
  skills: string | null;
  bio: string | null;
  portfolio: string | null;
  country: string | null;
};

const directoryColumns = {
  userId: talentProfiles.userId,
  name: users.name,
  role: talentProfiles.role,
  skills: talentProfiles.skills,
  bio: talentProfiles.bio,
  portfolio: talentProfiles.portfolio,
  country: talentProfiles.country,
};

export async function listVerifiedTalent(
  filters: { role?: string; skill?: string } = {}
): Promise<DirectoryTalent[]> {
  const conds = [eq(talentProfiles.verified, true)];
  if (filters.role) conds.push(eq(talentProfiles.role, filters.role));
  if (filters.skill) conds.push(ilike(talentProfiles.skills, `%${filters.skill}%`));

  return db
    .select(directoryColumns)
    .from(talentProfiles)
    .innerJoin(users, eq(users.id, talentProfiles.userId))
    .where(and(...conds))
    .orderBy(desc(talentProfiles.updatedAt));
}

export async function getVerifiedTalentById(userId: string): Promise<DirectoryTalent | null> {
  const [row] = await db
    .select(directoryColumns)
    .from(talentProfiles)
    .innerJoin(users, eq(users.id, talentProfiles.userId))
    .where(and(eq(talentProfiles.userId, userId), eq(talentProfiles.verified, true)));
  return row ?? null;
}

// ---------- Interests ----------

export async function hasPendingInterest(employerId: string, talentId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: talentInterests.id })
    .from(talentInterests)
    .where(
      and(
        eq(talentInterests.employerId, employerId),
        eq(talentInterests.talentId, talentId),
        eq(talentInterests.status, "Pending")
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function createInterest(data: {
  employerId: string;
  talentId: string;
  message: string | null;
}): Promise<TalentInterestRow> {
  const [row] = await db.insert(talentInterests).values(data).returning();
  return row;
}

export async function countInterestsForTalent(talentId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(talentInterests)
    .where(eq(talentInterests.talentId, talentId));
  return row?.value ?? 0;
}

export type InterestListItem = {
  id: string;
  message: string | null;
  status: TalentInterestRow["status"];
  createdAt: Date;
  employerName: string;
  employerEmail: string;
  talentName: string;
  talentEmail: string;
};

export async function listInterests(): Promise<InterestListItem[]> {
  const employerUser = alias(users, "employer_user");
  const talentUser = alias(users, "talent_user");
  return db
    .select({
      id: talentInterests.id,
      message: talentInterests.message,
      status: talentInterests.status,
      createdAt: talentInterests.createdAt,
      employerName: employerUser.name,
      employerEmail: employerUser.email,
      talentName: talentUser.name,
      talentEmail: talentUser.email,
    })
    .from(talentInterests)
    .innerJoin(employerUser, eq(employerUser.id, talentInterests.employerId))
    .innerJoin(talentUser, eq(talentUser.id, talentInterests.talentId))
    .orderBy(desc(talentInterests.createdAt));
}

// Both sides of an interest, for addressing notifications about it by name.
export async function getInterestParties(id: string): Promise<{
  employerId: string;
  talentId: string;
  employerName: string;
  talentName: string;
} | null> {
  const employerUser = alias(users, "employer_user");
  const talentUser = alias(users, "talent_user");
  const [row] = await db
    .select({
      employerId: talentInterests.employerId,
      talentId: talentInterests.talentId,
      employerName: employerUser.name,
      talentName: talentUser.name,
    })
    .from(talentInterests)
    .innerJoin(employerUser, eq(employerUser.id, talentInterests.employerId))
    .innerJoin(talentUser, eq(talentUser.id, talentInterests.talentId))
    .where(eq(talentInterests.id, id));
  return row ?? null;
}

export async function updateInterestStatus(
  id: string,
  status: TalentInterestRow["status"]
): Promise<TalentInterestRow | null> {
  const [row] = await db
    .update(talentInterests)
    .set({ status, updatedAt: new Date() })
    .where(eq(talentInterests.id, id))
    .returning();
  return row ?? null;
}

// ---------- Notifications ----------

// Cap on what the bell fetches. The dropdown scrolls; nobody reads past this.
const NOTIFICATION_PAGE_SIZE = 20;

export async function createNotification(data: {
  userId: string;
  body: string;
  href?: string | null;
}): Promise<void> {
  await db.insert(notifications).values({
    userId: data.userId,
    body: data.body,
    href: data.href ?? null,
  });
}

export async function listNotificationsForUser(userId: string): Promise<NotificationRow[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(NOTIFICATION_PAGE_SIZE);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

// userId is part of the predicate, not just the lookup — a caller can only ever
// delete their own notification, even if they guess someone else's id.
export async function deleteNotification(id: string, userId: string): Promise<void> {
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

// ---------- Admin: talent account verification ----------

export type TalentAccount = {
  userId: string;
  name: string;
  email: string;
  role: string | null;
  skills: string | null;
  verified: boolean;
  createdAt: Date;
};

export async function listTalentAccounts(): Promise<TalentAccount[]> {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: talentProfiles.role,
      skills: talentProfiles.skills,
      verified: talentProfiles.verified,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(talentProfiles, eq(talentProfiles.userId, users.id))
    .where(eq(users.role, "talent"))
    .orderBy(desc(users.createdAt));
  // verified is null when the talent has no profile row yet — treat as false.
  return rows.map((r) => ({ ...r, verified: r.verified ?? false }));
}

export async function setTalentVerified(userId: string, verified: boolean): Promise<void> {
  await db
    .insert(talentProfiles)
    .values({ userId, verified })
    .onConflictDoUpdate({
      target: talentProfiles.userId,
      set: { verified, updatedAt: new Date() },
    });
}
