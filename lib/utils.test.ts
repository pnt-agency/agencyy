import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./utils";

// A fixed "now" keeps these deterministic — the helper takes it as a param
// precisely so the tests don't race the clock.
const NOW = new Date("2026-07-16T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("shows sub-minute ages as 'just now'", () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe("just now");
    expect(formatRelativeTime(ago(59 * SECOND), NOW)).toBe("just now");
  });

  it("counts whole minutes, hours and days", () => {
    expect(formatRelativeTime(ago(MINUTE), NOW)).toBe("1m ago");
    expect(formatRelativeTime(ago(59 * MINUTE), NOW)).toBe("59m ago");
    expect(formatRelativeTime(ago(HOUR), NOW)).toBe("1h ago");
    expect(formatRelativeTime(ago(23 * HOUR), NOW)).toBe("23h ago");
    expect(formatRelativeTime(ago(DAY), NOW)).toBe("1d ago");
    expect(formatRelativeTime(ago(6 * DAY), NOW)).toBe("6d ago");
  });

  it("falls back to an absolute date at a week and beyond", () => {
    expect(formatRelativeTime(ago(7 * DAY), NOW)).toBe("Jul 9");
    expect(formatRelativeTime(ago(60 * DAY), NOW)).toBe("May 17");
  });

  it("accepts an ISO string, since that's how the server action sends it", () => {
    expect(formatRelativeTime(ago(2 * HOUR).toISOString(), NOW)).toBe("2h ago");
  });

  it("treats a future timestamp as 'just now' rather than negative time", () => {
    // Server/client clock skew can put createdAt slightly ahead of the client.
    expect(formatRelativeTime(new Date(NOW.getTime() + 5 * SECOND), NOW)).toBe("just now");
  });
});
