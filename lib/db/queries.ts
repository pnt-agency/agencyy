import { eq, desc, and, gte } from "drizzle-orm";
import { db } from ".";
import { talents, employers, type TalentRow, type EmployerRow } from "./schema";
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
