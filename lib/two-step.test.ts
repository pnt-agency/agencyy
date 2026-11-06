import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory stand-ins for the database, rate limiter and mailer, so the real
// issue/verify logic runs end to end without any of them.
const state = vi.hoisted(() => ({
  tokens: new Map<
    string,
    { id: string; userId: string; tokenHash: string; purpose: string; expiresAt: Date }
  >(),
  allowed: true,
  sendFails: false,
  sent: [] as { email: string; code: string; kind: string }[],
}));

vi.mock("./db/queries", () => ({
  createAuthToken: async (t: { userId: string; tokenHash: string; purpose: string; expiresAt: Date }) => {
    for (const [id, row] of state.tokens) {
      if (row.userId === t.userId && row.purpose === t.purpose) state.tokens.delete(id);
    }
    const id = `tok-${state.tokens.size}-${Math.random()}`;
    state.tokens.set(id, { id, ...t });
  },
  deleteAuthToken: async (id: string) => {
    state.tokens.delete(id);
  },
  deleteAuthTokensFor: async (userId: string, purpose: string) => {
    for (const [id, row] of state.tokens) {
      if (row.userId === userId && row.purpose === purpose) state.tokens.delete(id);
    }
  },
  findValidAuthToken: async (hash: string, purpose: string) =>
    [...state.tokens.values()].find(
      (row) => row.tokenHash === hash && row.purpose === purpose && row.expiresAt > new Date()
    ) ?? null,
}));

vi.mock("./rate-limit", () => ({
  RATE_LIMITS: { TWO_STEP_SEND: { name: "send" }, TWO_STEP_VERIFY: { name: "verify" } },
  checkRateLimit: async () => (state.allowed ? { allowed: true } : { allowed: false, retryAfterMs: 60_000 }),
}));

vi.mock("./resend", () => ({
  sendTwoStepCodeEmail: async (email: string, _name: string, code: string, kind: string) => {
    if (state.sendFails) throw new Error("mail down");
    state.sent.push({ email, code, kind });
  },
}));

import {
  generateTwoStepCode,
  hashTwoStepCode,
  issueTwoStepCode,
  verifyTwoStepCode,
  SIGN_IN_CODE,
  SETUP_CODE,
} from "./two-step";
import { normalizeTwoStepCode } from "./two-step-shared";

process.env.NEXTAUTH_SECRET = "test-secret-for-two-step";

const alice = { id: "user-alice", email: "alice@example.com", name: "Alice" };
const bob = { id: "user-bob", email: "bob@example.com", name: "Bob" };
const lastCode = () => state.sent[state.sent.length - 1].code;

beforeEach(() => {
  state.tokens.clear();
  state.sent.length = 0;
  state.allowed = true;
  state.sendFails = false;
});

describe("code format", () => {
  it("generates six digits, keeping leading zeros", () => {
    for (let i = 0; i < 200; i++) expect(generateTwoStepCode()).toMatch(/^\d{6}$/);
  });

  it("accepts what people type or paste, and nothing else", () => {
    expect(normalizeTwoStepCode("123456")).toBe("123456");
    expect(normalizeTwoStepCode(" 123 456 ")).toBe("123456");
    expect(normalizeTwoStepCode("123-456")).toBe("123456");
    expect(normalizeTwoStepCode("12345")).toBeNull();
    expect(normalizeTwoStepCode("1234567")).toBeNull();
    expect(normalizeTwoStepCode("12a456")).toBeNull();
    expect(normalizeTwoStepCode(123456)).toBeNull();
    expect(normalizeTwoStepCode(undefined)).toBeNull();
  });
});

describe("hashTwoStepCode", () => {
  it("is deterministic but bound to the account, the purpose and the server secret", () => {
    const base = hashTwoStepCode(alice.id, SIGN_IN_CODE, "123456");
    expect(hashTwoStepCode(alice.id, SIGN_IN_CODE, "123456")).toBe(base);
    expect(hashTwoStepCode(bob.id, SIGN_IN_CODE, "123456")).not.toBe(base);
    expect(hashTwoStepCode(alice.id, SETUP_CODE, "123456")).not.toBe(base);

    process.env.NEXTAUTH_SECRET = "a-different-secret";
    expect(hashTwoStepCode(alice.id, SIGN_IN_CODE, "123456")).not.toBe(base);
    process.env.NEXTAUTH_SECRET = "test-secret-for-two-step";
  });

  it("never stores the code itself", () => {
    expect(hashTwoStepCode(alice.id, SIGN_IN_CODE, "123456")).not.toContain("123456");
  });
});

describe("issue and verify", () => {
  it("emails a code that verifies once and is then used up", async () => {
    expect(await issueTwoStepCode(alice, SIGN_IN_CODE)).toBe("sent");
    expect(state.sent).toEqual([{ email: alice.email, code: expect.any(String), kind: "sign-in" }]);

    const code = lastCode();
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, code)).toBe("ok");
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, code)).toBe("invalid");
  });

  it("rejects a wrong code without spending the right one", async () => {
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    const code = lastCode();
    const wrong = code === "000000" ? "111111" : "000000";
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, wrong)).toBe("invalid");
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, code)).toBe("ok");
  });

  it("won't accept one account's code for another", async () => {
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    expect(await verifyTwoStepCode(bob.id, SIGN_IN_CODE, lastCode())).toBe("invalid");
  });

  it("keeps setup codes and sign-in codes separate", async () => {
    await issueTwoStepCode(alice, SETUP_CODE);
    expect(state.sent[0].kind).toBe("setup");
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, lastCode())).toBe("invalid");
    expect(await verifyTwoStepCode(alice.id, SETUP_CODE, lastCode())).toBe("ok");
  });

  it("invalidates the previous code when a new one is sent", async () => {
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    const first = lastCode();
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    const second = lastCode();
    if (first !== second) {
      expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, first)).toBe("invalid");
    }
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, second)).toBe("ok");
  });

  it("rejects an expired code", async () => {
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    for (const row of state.tokens.values()) row.expiresAt = new Date(Date.now() - 1000);
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, lastCode())).toBe("invalid");
  });

  it("treats malformed input as a wrong code", async () => {
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, "not a code")).toBe("invalid");
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, undefined)).toBe("invalid");
  });

  it("refuses to send or check codes once the account is rate limited", async () => {
    await issueTwoStepCode(alice, SIGN_IN_CODE);
    const code = lastCode();
    state.allowed = false;
    expect(await issueTwoStepCode(alice, SIGN_IN_CODE)).toBe("rate_limited");
    expect(await verifyTwoStepCode(alice.id, SIGN_IN_CODE, code)).toBe("rate_limited");
  });

  it("leaves no live code behind when the email can't be sent", async () => {
    state.sendFails = true;
    expect(await issueTwoStepCode(alice, SIGN_IN_CODE)).toBe("send_failed");
    expect(state.tokens.size).toBe(0);
  });
});
