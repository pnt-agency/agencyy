import { describe, it, expect } from "vitest";
import { isPlausibleStartDate, employerInputSchema } from "./validation";

/** A valid inquiry, for tests that vary one field at a time. */
function inquiry(overrides: Record<string, unknown> = {}) {
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return {
    companyName: "Acme Corp",
    contactName: "Jane Smith",
    email: "jane@acme.com",
    phone: "+1 234 567 8900",
    country: "United States",
    roleNeeded: "Virtual Assistant",
    numberNeeded: 2,
    budget: "Under $500/month",
    startDate: nextMonth,
    requirements: "",
    ...overrides,
  };
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

describe("isPlausibleStartDate", () => {
  it("accepts a date in the near future", () => {
    expect(isPlausibleStartDate(isoDaysFromNow(30))).toBe(true);
  });

  it("accepts today", () => {
    expect(isPlausibleStartDate(isoDaysFromNow(0))).toBe(true);
  });

  it("accepts a date a few days back, for timezone skew", () => {
    expect(isPlausibleStartDate(isoDaysFromNow(-2))).toBe(true);
  });

  it("rejects the date every observed spam submission carried", () => {
    // Random digits in a date input, stored verbatim because the old rule was
    // only "non-empty string".
    expect(isPlausibleStartDate("1970-05-31")).toBe(false);
  });

  it("rejects free text", () => {
    expect(isPlausibleStartDate("next tuesday")).toBe(false);
    expect(isPlausibleStartDate("Lqolrpwp")).toBe(false);
    expect(isPlausibleStartDate("")).toBe(false);
  });

  it("rejects a date that looks well-formed but isn't on the calendar", () => {
    // Date rolls this forward to March rather than rejecting it.
    expect(isPlausibleStartDate("2026-02-31")).toBe(false);
    expect(isPlausibleStartDate("2026-13-01")).toBe(false);
  });

  it("rejects a date well in the past", () => {
    expect(isPlausibleStartDate(isoDaysFromNow(-90))).toBe(false);
  });

  it("rejects a date beyond any real planning horizon", () => {
    expect(isPlausibleStartDate("2099-01-01")).toBe(false);
  });

  it("rejects non-ISO formats rather than guessing at them", () => {
    expect(isPlausibleStartDate("31/05/2026")).toBe(false);
    expect(isPlausibleStartDate("2026-5-31")).toBe(false);
  });
});

describe("employerInputSchema start date", () => {
  it("accepts a well-formed inquiry", () => {
    expect(employerInputSchema.safeParse(inquiry()).success).toBe(true);
  });

  it("rejects the spam payload shape", () => {
    expect(employerInputSchema.safeParse(inquiry({ startDate: "1970-05-31" })).success).toBe(false);
  });

  it("still rejects an empty start date", () => {
    expect(employerInputSchema.safeParse(inquiry({ startDate: "" })).success).toBe(false);
  });
});
