import { describe, it, expect } from "vitest";
import {
  registerMemberSchema,
  talentProfileSchema,
  employerProfileSchema,
  requestResetSchema,
  resetPasswordSchema,
  deleteAccountSchema,
  talentInputSchema,
  employerInputSchema,
  kycSubmissionSchema,
  kycReviewSchema,
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

  it("accepts a weak but long-enough password", () => {
    // Strength is advice, not a gate: the meter will call this "Very weak" and
    // the form still submits it.
    expect(registerMemberSchema.safeParse({ ...valid, password: "password123" }).success).toBe(true);
    expect(
      registerMemberSchema.safeParse({ ...valid, password: "JaneDoe-1990" }).success
    ).toBe(true);
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

describe("deleteAccountSchema", () => {
  it("requires the confirmation word, ignoring case and surrounding space", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: " delete " }).success).toBe(true);
  });

  it("rejects anything else, so an empty or stray submit can't destroy an account", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "yes" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
  });
});

describe("public lead schemas", () => {
  it("coerces employer numberNeeded and enforces a minimum", () => {
    const base = {
      companyName: "Acme", contactName: "Jo", email: "jo@acme.com", phone: "12345",
      country: "US", roleNeeded: "VA", budget: "$1k",
      // Relative, not fixed: startDate is now bounded to a window around today,
      // so a hardcoded date silently becomes invalid as the suite ages.
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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

describe("link fields accept only http(s)", () => {
  // These are rendered as clickable links in the admin dashboard, and the
  // talent application is a public, unauthenticated endpoint.
  const ok = {
    name: "Jo", email: "jo@x.com", phone: "12345", country: "US", role: "VA",
    experience: "3", bio: "a decent bio here", whyJoin: "a decent reason here",
  };
  const unsafe = [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ];

  it.each(["portfolio", "cvLink"] as const)("rejects non-web schemes in the application's %s", (field) => {
    for (const value of unsafe) {
      expect(talentInputSchema.safeParse({ ...ok, [field]: value }).success, value).toBe(false);
    }
  });

  it.each(["portfolio", "cvLink"] as const)("still accepts http(s) and empty in the application's %s", (field) => {
    expect(talentInputSchema.safeParse({ ...ok, [field]: "https://linkedin.com/in/jo" }).success).toBe(true);
    expect(talentInputSchema.safeParse({ ...ok, [field]: "http://example.com/cv.pdf" }).success).toBe(true);
    expect(talentInputSchema.safeParse({ ...ok, [field]: "" }).success).toBe(true);
  });

  it("rejects non-web schemes in the member profile portfolio", () => {
    for (const value of unsafe) {
      expect(talentProfileSchema.safeParse({ portfolio: value }).success, value).toBe(false);
    }
  });
});

describe("KYC submission schema", () => {
  const file = (prefix: "id" | "selfie", ext = "jpg") => ({
    key: `kyc/${prefix}/6f1c2d34-1234-4abc-8def-1234567890ab.${ext}`,
    filename: `document.${ext}`,
    size: 1024,
    contentType: ext === "pdf" ? "application/pdf" : "image/jpeg",
  });

  const valid = {
    legalName: "Ada Okafor",
    dateOfBirth: "1994-05-12",
    country: "Nigeria",
    idType: "Passport" as const,
    idNumber: "A1234567",
    idDocument: file("id", "pdf"),
    selfie: file("selfie"),
    consent: true,
  };

  it("accepts a complete submission", () => {
    expect(kycSubmissionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a document key outside the KYC prefixes", () => {
    expect(
      kycSubmissionSchema.safeParse({
        ...valid,
        idDocument: { ...file("id"), key: "cv/6f1c2d34-1234-4abc-8def-1234567890ab.pdf" },
      }).success
    ).toBe(false);
    // A selfie slot must not accept an ID file.
    expect(
      kycSubmissionSchema.safeParse({
        ...valid,
        selfie: { ...file("selfie"), key: file("id").key },
      }).success
    ).toBe(false);
  });

  it("rejects a selfie uploaded as a PDF", () => {
    expect(
      kycSubmissionSchema.safeParse({ ...valid, selfie: file("selfie", "pdf") }).success
    ).toBe(false);
  });

  it("requires the NDPA consent flag", () => {
    expect(kycSubmissionSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("rejects under-18 and impossible birth dates", () => {
    const thisYear = new Date().getUTCFullYear();
    expect(
      kycSubmissionSchema.safeParse({ ...valid, dateOfBirth: `${thisYear - 17}-01-01` }).success
    ).toBe(false);
    expect(
      kycSubmissionSchema.safeParse({ ...valid, dateOfBirth: "1990-02-31" }).success
    ).toBe(false);
    expect(
      kycSubmissionSchema.safeParse({ ...valid, dateOfBirth: "not-a-date" }).success
    ).toBe(false);
  });

  it("rejects an unknown ID type", () => {
    expect(
      kycSubmissionSchema.safeParse({ ...valid, idType: "Library Card" }).success
    ).toBe(false);
  });
});

describe("KYC review schema", () => {
  const userId = "6f1c2d34-1234-4abc-8def-1234567890ab";

  it("allows approval without a note", () => {
    expect(kycReviewSchema.safeParse({ userId, decision: "approve" }).success).toBe(true);
  });

  it("requires a note when rejecting", () => {
    expect(kycReviewSchema.safeParse({ userId, decision: "reject" }).success).toBe(false);
    expect(
      kycReviewSchema.safeParse({ userId, decision: "reject", note: "   " }).success
    ).toBe(false);
    expect(
      kycReviewSchema.safeParse({ userId, decision: "reject", note: "Photo is blurred" }).success
    ).toBe(true);
  });
});
