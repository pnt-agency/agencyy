import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const talentStatusEnum = pgEnum("talent_status", [
  "Applicant",
  "Screened",
  "Trained",
  "Verified",
  "Premium Verified",
]);

export const employerStatusEnum = pgEnum("employer_status", [
  "New Inquiry",
  "Contacted",
  "In Progress",
  "Closed Won",
  "Closed Lost",
]);

// ---------- Tables ----------

export const talents = pgTable("talents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  role: text("role").notNull(),
  experience: text("experience").notNull(),
  portfolio: text("portfolio"),
  bio: text("bio").notNull(),
  whyJoin: text("why_join").notNull(),
  cvLink: text("cv_link"),
  status: talentStatusEnum("status").notNull().default("Applicant"),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const employers = pgTable("employers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  roleNeeded: text("role_needed").notNull(),
  numberNeeded: integer("number_needed").notNull(),
  budget: text("budget").notNull(),
  startDate: text("start_date").notNull(),
  requirements: text("requirements"),
  status: employerStatusEnum("status").notNull().default("New Inquiry"),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Admin/user accounts for NextAuth (replaces single ADMIN_EMAIL/PASSWORD env pair)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // Null when the user only ever signs in via Google OAuth
  passwordHash: text("password_hash"),
  // Authorization role. Only "admin" may access /admin and mutate records.
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Member profiles — 1:1 with a user account. Kept separate from the CRM lead
// tables (talents/employers) above, which the admin pipeline owns.
export const talentProfiles = pgTable("talent_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone"),
  country: text("country"),
  bio: text("bio"),
  skills: text("skills"),
  portfolio: text("portfolio"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const employerProfiles = pgTable("employer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name"),
  phone: text("phone"),
  country: text("country"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TalentRow = typeof talents.$inferSelect;
export type NewTalentRow = typeof talents.$inferInsert;
export type EmployerRow = typeof employers.$inferSelect;
export type NewEmployerRow = typeof employers.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type TalentProfileRow = typeof talentProfiles.$inferSelect;
export type NewTalentProfileRow = typeof talentProfiles.$inferInsert;
export type EmployerProfileRow = typeof employerProfiles.$inferSelect;
export type NewEmployerProfileRow = typeof employerProfiles.$inferInsert;
