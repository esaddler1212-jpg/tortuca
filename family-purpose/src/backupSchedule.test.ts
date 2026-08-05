import { describe, expect, it } from "vitest";
import {
  isPastDailyBackupTime,
  pacificDateKey,
} from "./backupSchedule";

describe("pacificDateKey", () => {
  it("uses America/Los_Angeles calendar date", () => {
    // 2026-08-05 10:00 UTC is still Aug 5 in Pacific (PDT)
    const d = new Date("2026-08-05T10:00:00.000Z");
    expect(pacificDateKey(d)).toMatch(/^2026-08-0[45]$/);
  });
});

describe("isPastDailyBackupTime", () => {
  it("is false before 2:30 PM Pacific", () => {
    // 2:00 PM PDT = 21:00 UTC on a summer day
    const d = new Date("2026-08-05T21:00:00.000Z");
    expect(isPastDailyBackupTime(d)).toBe(false);
  });

  it("is true at 2:30 PM Pacific and later", () => {
    // 2:30 PM PDT = 21:30 UTC
    const d = new Date("2026-08-05T21:30:00.000Z");
    expect(isPastDailyBackupTime(d)).toBe(true);
  });
});
