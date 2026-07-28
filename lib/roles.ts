// Talent role categories, shared across the apply form, profile setup, and the
// employer directory filter.
export const TALENT_ROLES = [
  "Virtual Assistant",
  "Customer Support",
  "Social Media Manager",
  "Content Writer",
  "Bookkeeper",
  "Project Manager",
  "Other",
] as const;

export type TalentRole = (typeof TALENT_ROLES)[number];

// Account roles — distinct from the job categories above. "user" is transient:
// a fresh Google signup holds it until they pick talent or employer at profile
// setup, so it is never something an admin assigns.
export const ASSIGNABLE_ACCOUNT_ROLES = ["talent", "employer", "admin"] as const;

export type AssignableAccountRole = (typeof ASSIGNABLE_ACCOUNT_ROLES)[number];

export function isAssignableAccountRole(value: string): value is AssignableAccountRole {
  return (ASSIGNABLE_ACCOUNT_ROLES as readonly string[]).includes(value);
}
