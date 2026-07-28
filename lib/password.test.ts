import { describe, it, expect } from "vitest";
import { evaluatePassword, MIN_PASSWORD_LENGTH } from "./password";

describe("evaluatePassword", () => {
  it("scores an empty password as zero with no suggestions to make yet", () => {
    const result = evaluatePassword("");
    expect(result.score).toBe(0);
    expect(result.suggestions).toEqual([]);
  });

  it("rewards length over variety", () => {
    const short = evaluatePassword("Ab1!efgh"); // 8 chars, 4 classes
    const long = evaluatePassword("bramble-thicket-harbor"); // 22 chars, 2 classes
    expect(long.score).toBeGreaterThan(short.score);
  });

  it("gives a long, varied password the top score", () => {
    const result = evaluatePassword("Vault-Thicket-92!x");
    expect(result.score).toBe(4);
    expect(result.label).toBe("Very strong");
    expect(result.suggestions).toEqual([]);
  });

  it("zeroes the score for a blocklisted password no matter how long", () => {
    const result = evaluatePassword("Passw0rd!");
    expect(result.score).toBe(0);
    expect(result.suggestions).toContain("Avoid common passwords — this one is easy to guess");
  });

  it("recognises blocklisted words behind a digit or symbol suffix", () => {
    expect(evaluatePassword("letmein123").score).toBe(0);
    expect(evaluatePassword("iloveyou!").score).toBe(0);
  });

  it("ignores personal fragments too short to be meaningful", () => {
    // "Jo" is two characters — grading down every password containing it would
    // be absurd, so short name words are not treated as personal terms.
    expect(evaluatePassword("jonquil-harbor-92", { name: "Jo Ng" }).score).toBeGreaterThan(0);
  });

  it("catches the email local part, not just the name", () => {
    const result = evaluatePassword("janedoe2024!", { email: "janedoe@example.com" });
    expect(result.score).toBe(0);
  });

  it("zeroes the score when the password contains the user's own details", () => {
    const result = evaluatePassword("Jane-Doe-Rocks-2024!", { name: "Jane Doe" });
    expect(result.score).toBe(0);
    expect(result.suggestions).toContain("Leave your name and email out of it");
  });

  it("caps repeated and sequential runs at weak", () => {
    expect(evaluatePassword("Grrraaaannnd9!").score).toBeLessThanOrEqual(1);
    expect(evaluatePassword("Xk9-abcdefgh-Qm").score).toBeLessThanOrEqual(1);
    expect(evaluatePassword("Xk9-hgfedcba-Qm").score).toBeLessThanOrEqual(1);
  });

  it("does not flag a three-character run as sequential", () => {
    // "abc" is common inside ordinary words; only runs of four or more count.
    const result = evaluatePassword("thicket-abc-harbor");
    expect(result.score).toBeGreaterThan(1);
  });

  it("suggests more length below 12 characters", () => {
    const result = evaluatePassword("Rk7!qzmv");
    expect(result.suggestions).toContain("Make it 12 characters or longer");
  });

  it("names the character classes that are missing", () => {
    const result = evaluatePassword("bramblethicket");
    expect(result.suggestions.some((s) => s.startsWith("Mix in"))).toBe(true);
  });

  it(`scores anything under ${MIN_PASSWORD_LENGTH} characters as very weak`, () => {
    // Below the enforced minimum the form will refuse it, so the meter must not
    // flatter it just because all four character classes are present.
    expect(evaluatePassword("Ab1!xyq").score).toBe(0);
    expect(evaluatePassword("Ab1!xyqp").score).toBeGreaterThan(0);
  });
});
