import { describe, expect, it } from "vitest";
import {
  buildAttendanceListText,
  buildAttendanceRows,
  buildCareTeamText,
  buildWeeklySummary,
  buildWeeklySummaryText,
  weekRange,
} from "./documents";
import type {
  CheckIn,
  DebriefSettings,
  FollowUp,
  GroupSession,
} from "./types";

const settings: DebriefSettings = {
  staffEmail: "counselor@school.edu",
  companyEmail: "supervisor@company.com",
  attendanceEmail: "attendance@school.edu",
  careTeamEmail: "careteam@school.edu",
  yourName: "Jordan Reeves",
  yourRole: "Community mentor",
  schoolName: "Riverside High",
  groupName: "BOYS Group",
};

/** Local time keeps the check-in on the intended calendar day. */
function at(day: string, hour: number, minute = 0): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, hour, minute).toISOString();
}

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "10",
    classPeriod: "Period 3 — Algebra",
    reasons: ["Behavior / classroom concerns"],
    reasonNotes: "",
    createdAt: at("2026-03-04", 10),
    ...overrides,
  };
}

function followUp(overrides: Partial<FollowUp> = {}): FollowUp {
  return {
    dueAt: at("2026-03-06", 10),
    notes: "",
    services: [],
    careTeamReferral: false,
    ...overrides,
  };
}

function session(date: string, attendees: string[], topic = "Goal setting"): GroupSession {
  return {
    id: crypto.randomUUID(),
    date,
    topic,
    notes: "",
    attendees,
    updatedAt: `${date}T15:00:00.000Z`,
  };
}

describe("weekRange", () => {
  it("runs Monday to Sunday around a midweek day", () => {
    const week = weekRange("2026-03-04");
    expect(week.start).toBe("2026-03-02");
    expect(week.end).toBe("2026-03-08");
  });

  it("keeps Sunday in the week that started the Monday before", () => {
    expect(weekRange("2026-03-08").start).toBe("2026-03-02");
  });

  it("counts back whole weeks", () => {
    expect(weekRange("2026-03-04", 1).start).toBe("2026-02-23");
  });
});

describe("attendance clerk list", () => {
  const data = [
    checkIn({
      studentName: "Maria Lopez",
      studentId: "10482",
      createdAt: at("2026-03-04", 13, 5),
    }),
    checkIn({
      studentName: "Andre Bell",
      studentId: "10517",
      grade: "11",
      classPeriod: "Period 5 — Biology",
      createdAt: at("2026-03-04", 9, 20),
    }),
    checkIn({ studentName: "Other Day", createdAt: at("2026-03-05", 9) }),
  ];

  it("lists that day's students in the order they arrived", () => {
    const rows = buildAttendanceRows(data, "2026-03-04");
    expect(rows.map((r) => r.name)).toEqual(["Andre Bell", "Maria Lopez"]);
    expect(rows[0].studentId).toBe("10517");
    expect(rows[0].classPeriod).toBe("Period 5 — Biology");
  });

  it("marks a missing ID rather than leaving a blank column", () => {
    const rows = buildAttendanceRows(
      [checkIn({ studentId: undefined })],
      "2026-03-04",
    );
    expect(rows[0].studentId).toBe("—");
  });

  it("writes a clerk-ready list with IDs and periods", () => {
    const text = buildAttendanceListText(data, "2026-03-04", settings);
    expect(text).toContain("STUDENT CHECK-IN LIST — ATTENDANCE CLERK");
    expect(text).toContain("Students seen: 2");
    expect(text).toContain("Andre Bell");
    expect(text).toContain("ID 10517");
    expect(text).not.toContain("Other Day");
  });

  it("says plainly when nobody checked in", () => {
    expect(buildAttendanceListText(data, "2026-03-09", settings)).toContain(
      "No students checked in on this day.",
    );
  });
});

describe("weekly summary", () => {
  const week = weekRange("2026-03-04");
  const data = [
    checkIn({
      studentName: "Maria Lopez",
      studentId: "10482",
      createdAt: at("2026-03-02", 10),
    }),
    checkIn({ studentName: "Maria Lopez", createdAt: at("2026-03-05", 11) }),
    checkIn({ studentName: "Andre Bell", createdAt: at("2026-03-05", 12) }),
    checkIn({ studentName: "Last week", createdAt: at("2026-02-25", 10) }),
  ];
  const sessions = [
    session("2026-03-03", ["Andre Bell", "Devon Carter"]),
    session("2026-02-24", ["Andre Bell"]),
  ];

  it("groups who was seen by day, within the week only", () => {
    const summary = buildWeeklySummary(data, sessions, week);

    expect(summary.totalCheckIns).toBe(3);
    expect(summary.uniqueStudents).toBe(2);
    expect(summary.days).toHaveLength(2);
    expect(summary.days[0].students).toEqual(["Maria Lopez (ID 10482)"]);
    expect(summary.days[1].students).toEqual(["Maria Lopez", "Andre Bell"]);
  });

  it("flags students seen more than once", () => {
    const summary = buildWeeklySummary(data, sessions, week);
    expect(summary.repeatStudents).toEqual([{ name: "Maria Lopez", count: 2 }]);
  });

  it("counts only that week's group sessions", () => {
    const summary = buildWeeklySummary(data, sessions, week);
    expect(summary.sessions).toHaveLength(1);
    expect(summary.sessions[0].date).toBe("2026-03-03");
  });

  it("carries open follow-ups and referrals", () => {
    const summary = buildWeeklySummary(
      [
        checkIn({
          studentName: "Devon Carter",
          createdAt: at("2026-03-04", 10),
          followUp: followUp({ careTeamReferral: true }),
        }),
        checkIn({
          studentName: "Closed",
          createdAt: at("2026-03-04", 11),
          followUp: followUp({ completedAt: at("2026-03-05", 9) }),
        }),
      ],
      [],
      week,
    );

    expect(summary.openFollowUps.map((c) => c.studentName)).toEqual([
      "Devon Carter",
    ]);
    expect(summary.referrals).toHaveLength(1);
  });

  it("reads as a week in review", () => {
    const text = buildWeeklySummaryText(
      buildWeeklySummary(data, sessions, week),
      settings,
    );

    expect(text).toContain("WEEKLY CHECK-IN SUMMARY");
    expect(text).toContain("Check-ins: 3");
    expect(text).toContain("WHO WE CHECKED IN WITH");
    expect(text).toContain("Maria Lopez: 2 check-ins");
    expect(text).toContain("BOYS GROUP SESSIONS");
    expect(text).not.toContain("Last week");
  });

  it("says when a week was quiet", () => {
    const text = buildWeeklySummaryText(
      buildWeeklySummary([], [], weekRange("2026-04-01")),
      settings,
    );
    expect(text).toContain("No check-ins or group sessions were logged");
  });
});

describe("CARE team referrals", () => {
  const range = { start: "2026-03-02", end: "2026-03-08", label: "This week" };
  const referred = checkIn({
    studentName: "Devon Carter",
    studentId: "10933",
    grade: "9",
    reasons: ["Family / home situation"],
    reasonNotes: "Staying with an aunt since January.",
    outcome: "Referred to staff or service",
    outcomeNotes: "Walked him to the counseling office.",
    createdAt: at("2026-03-04", 10),
    followUp: followUp({
      services: ["Social worker", "Food or clothing assistance"],
      notes: "Aunt reached by phone, wants to meet.",
      careTeamReferral: true,
    }),
  });

  it("carries the detail a CARE team meeting needs", () => {
    const text = buildCareTeamText([referred], range, settings);

    expect(text).toContain("CARE TEAM REFERRALS");
    expect(text).toContain("CONFIDENTIAL");
    expect(text).toContain("Devon Carter (ID 10933)");
    expect(text).toContain("Staying with an aunt since January.");
    expect(text).toContain("Walked him to the counseling office.");
    expect(text).toContain(
      "Recommended services: Social worker; Food or clothing assistance",
    );
    expect(text).toContain("Aunt reached by phone, wants to meet.");
  });

  it("leaves out students who were not referred", () => {
    const text = buildCareTeamText(
      [referred, checkIn({ studentName: "Not referred" })],
      range,
      settings,
    );
    expect(text).toContain("Students referred: 1");
    expect(text).not.toContain("Not referred");
  });

  it("ignores referrals outside the window", () => {
    const text = buildCareTeamText(
      [referred],
      { start: "2026-04-01", end: "2026-04-30", label: "April" },
      settings,
    );
    expect(text).toContain("No CARE team referrals in this window.");
  });

  it("notes when no services were picked", () => {
    const text = buildCareTeamText(
      [
        checkIn({
          createdAt: at("2026-03-04", 10),
          followUp: followUp({ careTeamReferral: true }),
        }),
      ],
      range,
      settings,
    );
    expect(text).toContain("Recommended services: None recorded");
  });
});
