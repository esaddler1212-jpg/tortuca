import { describe, expect, it } from "vitest";
import {
  availableYears,
  buildPeriodReport,
  buildReportText,
  dayKeyOf,
  getRange,
} from "./reports";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

const settings: DebriefSettings = {
  ...DEFAULT_DEBRIEF_SETTINGS,
  staffEmail: "counselor@school.edu",
  companyEmail: "supervisor@company.com",
  attendanceEmail: "attendance@school.edu",
  careTeamEmail: "careteam@school.edu",
  yourName: "Jordan Reeves",
  yourRole: "Community mentor",
  schoolName: "Riverside High",
  groupName: "BOYS Group",
};

/** Local noon keeps the timestamp on the intended day in any time zone. */
function at(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 12).toISOString();
}

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "10",
    classPeriod: "Period 3 — Algebra",
    reasons: ["Academic support / tutoring"],
    reasonNotes: "",
    createdAt: at(2026, 2, 10),
    ...overrides,
  };
}

function session(overrides: Partial<GroupSession> = {}): GroupSession {
  return {
    id: crypto.randomUUID(),
    date: "2026-02-10",
    topic: "Goal setting",
    notes: "",
    attendees: ["Andre Bell", "Devon Carter"],
    updatedAt: at(2026, 2, 10),
    ...overrides,
  };
}

describe("getRange", () => {
  it("covers whole calendar quarters", () => {
    expect(getRange(2026, "q1")).toMatchObject({
      start: "2026-01-01",
      end: "2026-03-31",
    });
    expect(getRange(2026, "q2")).toMatchObject({
      start: "2026-04-01",
      end: "2026-06-30",
    });
    expect(getRange(2026, "q4")).toMatchObject({
      start: "2026-10-01",
      end: "2026-12-31",
    });
  });

  it("covers the whole year", () => {
    expect(getRange(2026, "year")).toMatchObject({
      start: "2026-01-01",
      end: "2026-12-31",
      label: "Calendar year 2026",
    });
  });
});

describe("dayKeyOf", () => {
  it("uses the local calendar day, not UTC", () => {
    const evening = new Date(2026, 6, 25, 21, 30).toISOString();
    expect(dayKeyOf(evening)).toBe("2026-07-25");
  });
});

describe("buildPeriodReport", () => {
  const data = [
    checkIn({ studentName: "Maria Lopez", createdAt: at(2026, 2, 10) }),
    checkIn({
      studentName: "Maria Lopez",
      createdAt: at(2026, 3, 4),
      reasons: ["Attendance / tardiness"],
    }),
    checkIn({
      studentName: "Andre Bell",
      grade: "11",
      createdAt: at(2026, 5, 6),
      reasons: ["Attendance / tardiness"],
    }),
    checkIn({ studentName: "Zoe Nunez", grade: "9", createdAt: at(2025, 11, 2) }),
  ];
  const sessions = [
    session({ date: "2026-02-10", attendees: ["Andre Bell", "Devon Carter"] }),
    session({ date: "2026-03-03", attendees: ["Andre Bell"] }),
    session({ date: "2026-05-05", attendees: ["Devon Carter", "Andre Bell"] }),
  ];

  it("counts only check-ins inside the quarter", () => {
    const q1 = buildPeriodReport(data, sessions, getRange(2026, "q1"));
    expect(q1.totalCheckIns).toBe(2);
    expect(q1.uniqueStudents).toBe(1);

    const q2 = buildPeriodReport(data, sessions, getRange(2026, "q2"));
    expect(q2.totalCheckIns).toBe(1);
  });

  it("counts a full year across quarters", () => {
    const year = buildPeriodReport(data, sessions, getRange(2026, "year"));
    expect(year.totalCheckIns).toBe(3);
    expect(year.uniqueStudents).toBe(2);
  });

  it("excludes other years", () => {
    expect(
      buildPeriodReport(data, sessions, getRange(2025, "year")).totalCheckIns,
    ).toBe(1);
  });

  it("ranks reasons by frequency", () => {
    const year = buildPeriodReport(data, sessions, getRange(2026, "year"));
    expect(year.byReason[0]).toEqual({
      label: "Attendance / tardiness",
      count: 2,
    });
  });

  it("breaks down by grade and month", () => {
    const year = buildPeriodReport(data, sessions, getRange(2026, "year"));
    expect(year.byGrade).toEqual([
      { label: "10", count: 2 },
      { label: "11", count: 1 },
    ]);
    expect(year.byMonth.map((m) => m.count)).toEqual([1, 1, 1]);
  });

  it("ranks the most frequent students", () => {
    const year = buildPeriodReport(data, sessions, getRange(2026, "year"));
    expect(year.topStudents[0]).toEqual({
      label: "Maria Lopez",
      grade: "10",
      count: 2,
    });
  });

  it("summarises group attendance for the period", () => {
    const q1 = buildPeriodReport(data, sessions, getRange(2026, "q1"));
    expect(q1.group.sessions).toBe(2);
    expect(q1.group.totalAttendance).toBe(3);
    expect(q1.group.uniqueAttendees).toBe(2);
    expect(q1.group.averageAttendance).toBe(1.5);
    expect(q1.group.bestAttended).toMatchObject({ date: "2026-02-10", count: 2 });
  });

  it("returns zeroes for an empty period", () => {
    const q3 = buildPeriodReport(data, sessions, getRange(2026, "q3"));
    expect(q3.totalCheckIns).toBe(0);
    expect(q3.group.sessions).toBe(0);
    expect(q3.group.averageAttendance).toBe(0);
    expect(buildReportText(q3, settings)).toContain(
      "No check-ins or group sessions were recorded",
    );
  });
});

describe("buildReportText", () => {
  it("leads with the range and headline counts", () => {
    const report = buildPeriodReport(
      [checkIn(), checkIn({ studentName: "Andre Bell", grade: "11" })],
      [session()],
      getRange(2026, "q1"),
    );
    const text = buildReportText(report, settings);

    expect(text).toContain("Q1 (Jan–Mar) 2026");
    expect(text).toContain("2026-01-01 through 2026-03-31");
    expect(text).toContain("Total check-ins: 2");
    expect(text).toContain("Students served: 2");
    expect(text).toContain("BOYS Group sessions: 1");
    expect(text).toContain("BOYS Group average attendance: 2");
    expect(text).toContain("School: Riverside High");
  });

  it("shows each reason with its share of the total", () => {
    const report = buildPeriodReport(
      [
        checkIn({ reasons: ["Attendance / tardiness"] }),
        checkIn({ reasons: ["Attendance / tardiness"] }),
        checkIn({ reasons: ["Family / home situation"] }),
      ],
      [],
      getRange(2026, "q1"),
    );
    const text = buildReportText(report, settings);
    expect(text).toContain("Attendance / tardiness: 2 (67%)");
    expect(text).toContain("Family / home situation: 1 (33%)");
  });

  it("keeps individual notes out of the shared summary", () => {
    const report = buildPeriodReport(
      [checkIn({ reasonNotes: "Confidential family detail" })],
      [],
      getRange(2026, "q1"),
    );
    expect(buildReportText(report, settings)).not.toContain(
      "Confidential family detail",
    );
  });
});

describe("availableYears", () => {
  it("lists years from the data plus the current year, newest first", () => {
    const years = availableYears(
      [checkIn({ createdAt: at(2024, 5, 1) })],
      [session({ date: "2025-03-01" })],
    );
    expect(years[0]).toBe(new Date().getFullYear());
    expect(years).toContain(2024);
    expect(years).toContain(2025);
    expect([...years]).toEqual([...years].sort((a, b) => b - a));
  });
});
