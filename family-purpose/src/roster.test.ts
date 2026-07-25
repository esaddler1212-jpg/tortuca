import { describe, expect, it } from "vitest";
import {
  buildRecentPeriods,
  buildRoster,
  findStudent,
  orderReasonsByUse,
} from "./roster";
import type { CheckIn, CheckInReason } from "./types";

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "9",
    classPeriod: "Period 3 — Algebra",
    reasons: ["Academic support / tutoring"] as CheckInReason[],
    reasonNotes: "",
    createdAt: "2026-07-20T15:00:00.000Z",
    ...overrides,
  };
}

describe("buildRoster", () => {
  it("returns one entry per student with their latest grade and period", () => {
    const roster = buildRoster([
      makeCheckIn({
        studentName: "Maria Lopez",
        grade: "9",
        classPeriod: "Period 1 — English",
        createdAt: "2026-07-20T15:00:00.000Z",
      }),
      makeCheckIn({
        studentName: "Maria Lopez",
        grade: "10",
        classPeriod: "Period 3 — Algebra",
        createdAt: "2026-07-24T15:00:00.000Z",
      }),
      makeCheckIn({
        studentName: "Andre Bell",
        grade: "11",
        createdAt: "2026-07-22T15:00:00.000Z",
      }),
    ]);

    expect(roster).toHaveLength(2);
    const maria = roster.find((s) => s.name === "Maria Lopez")!;
    expect(maria.grade).toBe("10");
    expect(maria.classPeriod).toBe("Period 3 — Algebra");
    expect(maria.count).toBe(2);
  });

  it("sorts most recently seen students first", () => {
    const roster = buildRoster([
      makeCheckIn({ studentName: "Older", createdAt: "2026-07-01T10:00:00.000Z" }),
      makeCheckIn({ studentName: "Newer", createdAt: "2026-07-24T10:00:00.000Z" }),
    ]);
    expect(roster.map((s) => s.name)).toEqual(["Newer", "Older"]);
  });

  it("treats names case-insensitively", () => {
    const roster = buildRoster([
      makeCheckIn({ studentName: "Maria Lopez" }),
      makeCheckIn({ studentName: "maria lopez" }),
    ]);
    expect(roster).toHaveLength(1);
  });
});

describe("findStudent", () => {
  const roster = buildRoster([makeCheckIn({ studentName: "Maria Lopez" })]);

  it("matches regardless of case and surrounding spaces", () => {
    expect(findStudent(roster, "  maria lopez ")?.name).toBe("Maria Lopez");
  });

  it("returns undefined for unknown or blank names", () => {
    expect(findStudent(roster, "Unknown Student")).toBeUndefined();
    expect(findStudent(roster, "   ")).toBeUndefined();
  });
});

describe("buildRecentPeriods", () => {
  it("lists distinct periods, most recent first", () => {
    const periods = buildRecentPeriods([
      makeCheckIn({
        classPeriod: "Period 1 — English",
        createdAt: "2026-07-20T15:00:00.000Z",
      }),
      makeCheckIn({
        classPeriod: "Period 3 — Algebra",
        createdAt: "2026-07-24T15:00:00.000Z",
      }),
      makeCheckIn({
        classPeriod: "Period 1 — English",
        createdAt: "2026-07-23T15:00:00.000Z",
      }),
    ]);
    expect(periods).toEqual(["Period 3 — Algebra", "Period 1 — English"]);
  });

  it("ignores blank periods", () => {
    expect(buildRecentPeriods([makeCheckIn({ classPeriod: "   " })])).toEqual([]);
  });
});

describe("orderReasonsByUse", () => {
  it("puts the most frequently used reasons first", () => {
    const ordered = orderReasonsByUse([
      makeCheckIn({ reasons: ["Attendance / tardiness"] }),
      makeCheckIn({ reasons: ["Attendance / tardiness"] }),
      makeCheckIn({ reasons: ["Social-emotional / wellness"] }),
    ]);
    expect(ordered[0]).toBe("Attendance / tardiness");
    expect(ordered[1]).toBe("Social-emotional / wellness");
  });

  it("keeps every reason available even when unused", () => {
    expect(orderReasonsByUse([])).toHaveLength(11);
  });
});
