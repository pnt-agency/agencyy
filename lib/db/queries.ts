import { eq, desc, and, gte, count, sql } from "drizzle-orm";
import { db } from ".";
import {
  talents,
  employers,
  users,
  talentProfiles,
  employerProfiles,
  authTokens,
  type TalentRow,
  type EmployerRow,
  type UserRow,
  type TalentProfileRow,
  type EmployerProfileRow,
  type AuthTokenRow,
} from "./schema";
import type { Talent, Employer } from "@/types";

// Reject repeat submissions from the same email inside this window. This is a
// lightweight anti-double-submit / anti-burst guard, not a full IP rate limiter.
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

// ---------- Talent ----------

export async function createTalentRecord(
  data: Omit<Talent, "id" | "status" | "createdAt">
): Promise<TalentRow> {
  const [record] = await db
    .insert(talents)
    .values({
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
  data: Omit<Employer, "id" | "status" | "createdAt">
): Promise<EmployerRow> {
  const [record] = await db
    .insert(employers)
    .values({
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

// A member's own lead records are matched by email against the public
// application/hire tables (there's no FK link yet — see follow-ups). Matched
// case-insensitively because those public forms don't normalize email casing.
export async function countTalentApplicationsByEmail(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({ value: count() })
    .from(talents)
    .where(sql`lower(${talents.email}) = ${normalized}`);
  return row?.value ?? 0;
}

export async function countEmployerInquiriesByEmail(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({ value: count() })
    .from(employers)
    .where(sql`lower(${employers.email}) = ${normalized}`);
  return row?.value ?? 0;
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
