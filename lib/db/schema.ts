import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  index,
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

export const interestStatusEnum = pgEnum("interest_status", [
  "Pending",
  "Intro Made",
  "Closed",
]);

// ---------- Tables ----------

export const talents = pgTable("talents", {
  id: uuid("id").primaryKey().defaultRandom(),
  // The member account this lead belongs to, when it can be attributed to one:
  // set at submit time from the session, or claimed later by email match on
  // register/verify. Null for leads from visitors who never made an account.
  // Nulled rather than deleted if the account goes away — the lead is still
  // ours to work.
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
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
  // See talents.userId — same attribution rules.
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
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
  // Set when the user confirms their email via a verification link.
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Single-use, hashed tokens for email verification and password reset. The raw
// token is emailed; only its SHA-256 hash is stored.
export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  purpose: text("purpose").notNull(), // "verify_email" | "reset_password"
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
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
  // Primary role (from TALENT_ROLES) — used for directory filtering.
  role: text("role"),
  bio: text("bio"),
  skills: text("skills"),
  portfolio: text("portfolio"),
  // Admin-controlled: only verified profiles appear in the employer directory.
  verified: boolean("verified").notNull().default(false),
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

// An employer expressing interest in a specific talent. Connections are
// admin-mediated: an admin reviews these and makes the intro.
export const talentInterests = pgTable("talent_interests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  talentId: uuid("talent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: interestStatusEnum("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// In-app notifications for the navbar bell. Written by server actions when
// something happens that a member should know about; read only by the owner.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    // Where the bell item links to, e.g. "/dashboard". Null renders as plain text.
    href: text("href"),
    // Null until the owner reads it — doubles as the unread flag and a timestamp.
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // The only read path is "newest N for this user".
  (table) => [index("notifications_user_created_idx").on(table.userId, table.createdAt)]
);

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
export type AuthTokenRow = typeof authTokens.$inferSelect;
export type NewAuthTokenRow = typeof authTokens.$inferInsert;
export type TalentInterestRow = typeof talentInterests.$inferSelect;
export type NewTalentInterestRow = typeof talentInterests.$inferInsert;
export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
