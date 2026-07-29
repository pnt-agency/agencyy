import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
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
  // A link to a CV hosted elsewhere (Drive, LinkedIn). Kept alongside the
  // uploaded file below — an applicant may provide either.
  cvLink: text("cv_link"),
  // An uploaded CV in the private R2 bucket. The key is stored, never a URL:
  // URLs to private objects are presigned and expire, so persisting one would
  // save a dead string. Filename and size are kept for display; content type
  // to set the right disposition on download.
  cvKey: text("cv_key"),
  cvFilename: text("cv_filename"),
  cvSize: integer("cv_size"),
  cvContentType: text("cv_content_type"),
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
  // Soft delete. The row is kept so signup cohorts, lead attribution and every
  // other historical count stay intact after someone leaves — but a non-null
  // deletedAt means "this account no longer exists" everywhere in the app, so
  // every read path that surfaces a user must filter on it. softDeleteUser()
  // also scrubs the identifying columns above; see lib/db/queries.ts.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
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

// ---------- Training ----------

// The training curriculum, moved out of the client component that used to
// hardcode it. Admins need to upload a video per module, and you can't attach a
// file to an array literal in a bundle.
export const trainingModules = pgTable("training_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Order in the curriculum, and what "complete the previous module" means.
  // Unique so two modules can't claim the same slot.
  position: integer("position").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Object key in the public R2 bucket. Null until a video is uploaded — the
  // module then shows as coming soon rather than a broken player, which is
  // exactly the failure the hardcoded /videos/*.mp4 paths used to produce.
  videoKey: text("video_key"),
  // Read off the file's metadata on upload so the module list can show a
  // runtime without every client loading every video to measure it.
  videoDurationSeconds: integer("video_duration_seconds"),
  // Hidden from members until switched on, so a half-built module can exist.
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trainingQuestions = pgTable(
  "training_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    // Answer choices in display order.
    options: jsonb("options").$type<string[]>().notNull(),
    // Index of the correct option. Nullable and currently unused: the existing
    // quiz never graded anything, it only required an answer to each question.
    // Stored so grading can be switched on later without a data migration.
    correctIndex: integer("correct_index"),
  },
  (table) => [index("training_questions_module_idx").on(table.moduleId, table.position)]
);

// One row per member per module they've engaged with. Replaces localStorage,
// which was per-browser, lost on a device change, and editable from devtools.
export const trainingProgress = pgTable(
  "training_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    // Set when the video reaches its end; gates the quiz.
    watchedAt: timestamp("watched_at", { withTimezone: true }),
    // Set when the quiz is submitted; unlocks the next module.
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    // Unique, not merely indexed: progress is written with an upsert that
    // targets this pair, which needs a real constraint to conflict against.
    uniqueIndex("training_progress_user_module_idx").on(table.userId, table.moduleId),
  ]
);

// Append-only record of what admins did. Written by every admin mutation (see
// lib/audit.ts) so "who changed this account, and when" has an answer.
//
// Append-only is currently a convention, not a grant: the app connects as the
// database owner, which can rewrite anything. Enforcing it means a second role
// without UPDATE/DELETE on this table.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The acting admin. Soft delete keeps their row, so this survives — but
    // it's nullable so a hard delete can't take the log entry with it.
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    // The actor's address *at the time of the action*, not a live join.
    // softDeleteUser() rewrites users.email to a tombstone, so without this
    // snapshot every entry by a departed admin would stop naming anyone.
    actorEmail: text("actor_email").notNull(),
    // Dotted verb from AUDIT_ACTIONS, e.g. "user.role.set".
    action: text("action").notNull(),
    // Polymorphic target, deliberately with no foreign key: a log entry has to
    // outlive the row it describes.
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id"),
    // Only the fields that changed — never whole rows. Copying a talent record
    // in here would duplicate their PII into a table we never scrub.
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The viewer reads newest-first; the second index answers "everything that
    // ever happened to this record".
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_target_idx").on(table.targetType, table.targetId),
  ]
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
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type NewAuditLogRow = typeof auditLogs.$inferInsert;
export type TrainingModuleRow = typeof trainingModules.$inferSelect;
export type NewTrainingModuleRow = typeof trainingModules.$inferInsert;
export type TrainingQuestionRow = typeof trainingQuestions.$inferSelect;
export type NewTrainingQuestionRow = typeof trainingQuestions.$inferInsert;
export type TrainingProgressRow = typeof trainingProgress.$inferSelect;
