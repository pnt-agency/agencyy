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
