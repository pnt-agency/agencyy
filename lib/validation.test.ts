import { describe, it, expect } from "vitest";
import {
  registerMemberSchema,
  talentProfileSchema,
  employerProfileSchema,
  requestResetSchema,
  resetPasswordSchema,
  talentInputSchema,
  employerInputSchema,
} from "./validation";

describe("registerMemberSchema", () => {
  const valid = { name: "Jane Doe", email: "Jane@Example.com", password: "supersecret", role: "talent" };

  it("accepts a valid member and lowercases the email", () => {
    const parsed = registerMemberSchema.parse(valid);
    expect(parsed.email).toBe("jane@example.com");
    expect(parsed.role).toBe("talent");
  });

  it("rejects a password shorter than 8 chars", () => {
    expect(registerMemberSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(registerMemberSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("rejects a role outside talent/employer", () => {
    expect(registerMemberSchema.safeParse({ ...valid, role: "admin" }).success).toBe(false);
    expect(registerMemberSchema.safeParse({ ...valid, role: "user" }).success).toBe(false);
  });
});

describe("profile schemas", () => {
  it("allows empty/optional talent fields but rejects a bad portfolio URL", () => {
    expect(talentProfileSchema.safeParse({}).success).toBe(true);
    expect(talentProfileSchema.safeParse({ portfolio: "" }).success).toBe(true);
    expect(talentProfileSchema.safeParse({ portfolio: "not-a-url" }).success).toBe(false);
    expect(talentProfileSchema.safeParse({ portfolio: "https://x.com" }).success).toBe(true);
  });

  it("allows empty employer fields", () => {
    expect(employerProfileSchema.safeParse({}).success).toBe(true);
    expect(employerProfileSchema.safeParse({ companyName: "Acme" }).success).toBe(true);
  });
});

describe("password reset schemas", () => {
  it("normalizes email in requestResetSchema", () => {
    const parsed = requestResetSchema.parse({ email: "  USER@Example.com " });
    expect(parsed.email).toBe("user@example.com");
  });

  it("requires a token and an 8+ char password in resetPasswordSchema", () => {
    expect(resetPasswordSchema.safeParse({ token: "t", password: "longenough" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", password: "longenough" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "t", password: "short" }).success).toBe(false);
  });
});

describe("public lead schemas", () => {
  it("coerces employer numberNeeded and enforces a minimum", () => {
    const base = {
      companyName: "Acme", contactName: "Jo", email: "jo@acme.com", phone: "12345",
      country: "US", roleNeeded: "VA", budget: "$1k", startDate: "2026-01-01",
    };
    expect(employerInputSchema.parse({ ...base, numberNeeded: "3" }).numberNeeded).toBe(3);
    expect(employerInputSchema.safeParse({ ...base, numberNeeded: 0 }).success).toBe(false);
  });

  it("requires the core talent application fields", () => {
    const ok = {
      name: "Jo", email: "jo@x.com", phone: "12345", country: "US", role: "VA",
      experience: "3", bio: "a decent bio here", whyJoin: "a decent reason here",
    };
    expect(talentInputSchema.safeParse(ok).success).toBe(true);
    expect(talentInputSchema.safeParse({ ...ok, bio: "short" }).success).toBe(false);
  });
});
