import * as z from "zod";
import { TALENT_ROLES } from "./roles";

// Server-authoritative schemas for the public submission actions.
// The apply/hire pages validate on the client for UX; these are re-checked
// inside the server actions because a server action is a public HTTP endpoint
// and cannot trust the client to have validated anything.

export const talentInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Invalid email address").max(254),
  phone: z.string().trim().min(5, "Phone number is required").max(40),
  country: z.string().trim().min(2, "Country is required").max(80),
  role: z.string().trim().min(1, "Role is required").max(80),
  experience: z.string().trim().min(1, "Experience is required").max(40),
  portfolio: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().min(10, "Bio must be at least 10 characters").max(5000),
  whyJoin: z
    .string()
    .trim()
    .min(10, "Please tell us why you want to join")
    .max(5000),
  cvLink: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
});

export const employerInputSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(160),
  contactName: z.string().trim().min(2, "Contact name is required").max(120),
  email: z.string().trim().email("Invalid email address").max(254),
  phone: z.string().trim().min(5, "Phone number is required").max(40),
  country: z.string().trim().min(2, "Country is required").max(80),
  roleNeeded: z.string().trim().min(1, "Role is required").max(80),
  numberNeeded: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must need at least 1 person")
    .max(10000),
  budget: z.string().trim().min(1, "Budget is required").max(80),
  startDate: z.string().trim().min(1, "Start date is required").max(40),
  requirements: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type TalentInput = z.infer<typeof talentInputSchema>;
export type EmployerInput = z.infer<typeof employerInputSchema>;

// ---------- Member accounts ----------

export const memberRoleEnum = z.enum(["talent", "employer"]);

export const registerMemberSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: memberRoleEnum,
});

export const talentProfileSchema = z.object({
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  role: z.enum(TALENT_ROLES).optional().or(z.literal("")),
  bio: z.string().trim().max(5000).optional().or(z.literal("")),
  skills: z.string().trim().max(1000).optional().or(z.literal("")),
  portfolio: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
});

export const employerProfileSchema = z.object({
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(5000).optional().or(z.literal("")),
});

// The profile form posts a role alongside the profile fields (used to place the
// data in the right table and to set the account's role on first save).
export const saveProfileSchema = z.object({
  role: memberRoleEnum,
  talent: talentProfileSchema.optional(),
  employer: employerProfileSchema.optional(),
});

export const requestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const expressInterestSchema = z.object({
  talentId: z.string().uuid(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type RegisterMemberInput = z.infer<typeof registerMemberSchema>;
export type TalentProfileInput = z.infer<typeof talentProfileSchema>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
