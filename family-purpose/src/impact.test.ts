import { describe, expect, it } from "vitest";
import {
  buildImpactReport,
  buildImpactText,
  describeAttendanceTrend,
  describeReasonShift,
} from "./impact";
import { getRange } from "./reports";
import type {
  CheckIn,
  CheckInOutcome,
  CheckInReason,
  DebriefSettings,
  GroupSession,
} from "./types";
import { categoryOf } from "./types";

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

/** Local noon keeps the timestamp on the intended day in any time zone. */
function at(month: number, day: number, year = 2026): string {
  return new Date(year, month - 1, day, 12).toISOString();
}

function checkIn(
  overrides: Partial<CheckIn> & { month?: number; day?: number } = {},
): CheckIn {
  const { month = 2, day = 10, ...rest } = overrides;
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "10",
    classPeriod: "Period 3",
    reasons: ["Academic support / tutoring"],
    reasonNotes: "",
    createdAt: at(month, day),
    ...rest,
  };
}

function session(
  date: string,
  attendees: string[],
): GroupSession {
  return {
    id: crypto.randomUUID(),
    date,
    topic: "Goal setting",
    notes: "",
    attendees,
    updatedAt: `${date}T15:00:00.000Z`,
  };
}

describe("reason categories", () => {
  it("sorts each reason into a reporting bucket", () => {
    expect(categoryOf("Behavior / classroom concerns")).toBe("Intervention");
    expect(categoryOf("Attendance / tardiness")).toBe("Intervention");
    expect(categoryOf("Academic support / tutoring")).toBe("Support");
    expect(categoryOf("Goal check-in / mentoring")).toBe("Growth");
    expect(categoryOf("Career or college planning")).toBe("Growth");
    expect(categoryOf("Other")).toBe("Other");
  });
});

describe("returning students", () => {
  const data = [
    checkIn({ studentName: "Maria Lopez", month: 1, day: 8 }),
    checkIn({ studentName: "Maria Lopez", month: 2, day: 5 }),
    checkIn({ studentName: "Maria Lopez", month: 3, day: 12 }),
    checkIn({ studentName: "Maria Lopez", month: 4, day: 2 }),
    checkIn({ studentName: "Andre Bell", grade: "11", month: 2, day: 6 }),
    checkIn({ studentName: "Andre Bell", grade: "11", month: 3, day: 6 }),
    checkIn({ studentName: "Zoe Nunez", grade: "9", month: 3, day: 9 }),
  ];

  it("counts who came back and who kept coming", () => {
    const { engagement } = buildImpactReport(data, [], getRange(2026, "year"));

    expect(engagement.studentsSeen).toBe(3);
    expect(engagement.returning).toBe(2);
    expect(engagement.returningShare).toBe(67);
    expect(engagement.sustained).toBe(1);
    expect(engagement.averagePerStudent).toBe(2.3);
  });

  it("tracks how long each student stayed engaged", () => {
    const { engagement } = buildImpactReport(data, [], getRange(2026, "year"));
    const maria = engagement.students[0];

    expect(maria.name).toBe("Maria Lopez");
    expect(maria.checkIns).toBe(4);
    expect(maria.firstSeen).toBe("2026-01-08");
    expect(maria.lastSeen).toBe("2026-04-02");
    expect(maria.weeksEngaged).toBe(12);
  });

  it("treats the same student written differently as one person", () => {
    const { engagement } = buildImpactReport(
      [
        checkIn({ studentName: "Maria Lopez" }),
        checkIn({ studentName: "  maria lopez " }),
      ],
      [],
      getRange(2026, "year"));
    expect(engagement.studentsSeen).toBe(1);
    expect(engagement.students[0].checkIns).toBe(2);
  });

  it("respects the selected period", () => {
    const q1 = buildImpactReport(data, [], getRange(2026, "q1"));
    expect(q1.engagement.students[0].checkIns).toBe(3);
    expect(q1.engagement.sustained).toBe(0);
  });
});

describe("attendance trend", () => {
  it("compares the first half of sessions with the second", () => {
    const sessions = [
      session("2026-01-07", ["Andre Bell", "Devon Carter"]),
      session("2026-01-21", ["Andre Bell", "Devon Carter"]),
      session("2026-02-07", ["Andre Bell", "Devon Carter", "Marcus Webb"]),
      session("2026-02-21", [
        "Andre Bell",
        "Devon Carter",
        "Marcus Webb",
        "Jalen Price",
      ]),
    ];
    const { attendance } = buildImpactReport([], sessions, getRange(2026, "year"));

    expect(attendance.sessionsHeld).toBe(4);
    expect(attendance.averageAttendance).toBe(2.8);
    expect(attendance.earlierAverage).toBe(2);
    expect(attendance.laterAverage).toBe(3.5);
    expect(attendance.change).toBe(1.5);
    expect(describeAttendanceTrend(attendance)).toContain("up");
  });

  it("reports a decline when attendance falls", () => {
    const { attendance } = buildImpactReport(
      [],
      [
        session("2026-01-07", ["Andre Bell", "Devon Carter", "Marcus Webb"]),
        session("2026-02-07", ["Andre Bell"]),
      ],
      getRange(2026, "year"));
    expect(attendance.change).toBe(-2);
    expect(describeAttendanceTrend(attendance)).toContain("down");
  });

  it("gives each member an attendance rate", () => {
    const { attendance } = buildImpactReport(
      [],
      [
        session("2026-01-07", ["Andre Bell", "Devon Carter"]),
        session("2026-01-21", ["Andre Bell"]),
        session("2026-02-07", ["Andre Bell", "Devon Carter"]),
        session("2026-02-21", ["Andre Bell"]),
      ],
      getRange(2026, "year"));

    expect(attendance.members[0]).toEqual({
      name: "Andre Bell",
      attended: 4,
      rate: 100,
    });
    expect(attendance.members[1]).toEqual({
      name: "Devon Carter",
      attended: 2,
      rate: 50,
    });
  });

  it("averages attendance by month", () => {
    const { attendance } = buildImpactReport(
      [],
      [
        session("2026-01-07", ["Andre Bell"]),
        session("2026-01-21", ["Andre Bell", "Devon Carter", "Marcus Webb"]),
        session("2026-02-07", ["Andre Bell", "Devon Carter"]),
      ],
      getRange(2026, "year"));

    expect(attendance.monthly).toEqual([
      { label: "Jan 2026", average: 2, sessions: 2 },
      { label: "Feb 2026", average: 2, sessions: 1 },
    ]);
  });

  it("declines to call a trend from a single session", () => {
    const { attendance } = buildImpactReport(
      [],
      [session("2026-01-07", ["Andre Bell"])],
      getRange(2026, "year"));
    expect(attendance.change).toBe(0);
    expect(describeAttendanceTrend(attendance)).toContain("Not enough sessions");
  });
});

describe("reason mix over time", () => {
  const intervention: CheckInReason[] = ["Behavior / classroom concerns"];
  const growth: CheckInReason[] = ["Goal check-in / mentoring"];

  it("shows intervention giving way to growth", () => {
    const data = [
      checkIn({ month: 1, day: 5, reasons: intervention }),
      checkIn({ month: 1, day: 12, reasons: intervention }),
      checkIn({ month: 2, day: 3, reasons: intervention }),
      checkIn({ month: 5, day: 4, reasons: growth }),
      checkIn({ month: 5, day: 18, reasons: growth }),
      checkIn({ month: 6, day: 1, reasons: intervention }),
    ];
    const { reasonMix } = buildImpactReport(data, [], getRange(2026, "year"));

    const growthShift = reasonMix.categories.find(
      (c) => c.category === "Growth",
    )!;
    const interventionShift = reasonMix.categories.find(
      (c) => c.category === "Intervention",
    )!;

    expect(growthShift.earlierShare).toBe(0);
    expect(growthShift.laterShare).toBe(67);
    expect(growthShift.change).toBe(67);
    expect(interventionShift.change).toBe(-67);
    expect(describeReasonShift(reasonMix)).toContain("+67 pts");
  });

  it("labels the two windows it compared", () => {
    const { reasonMix } = buildImpactReport(
      [
        checkIn({ month: 1, day: 5, reasons: intervention }),
        checkIn({ month: 3, day: 5, reasons: growth }),
      ],
      [],
      getRange(2026, "year"));

    expect(reasonMix.split?.earlier.start).toBe("2026-01-05");
    expect(reasonMix.split?.later.end).toBe("2026-03-05");
  });

  it("says so when there is only one day of data", () => {
    const { reasonMix } = buildImpactReport(
      [checkIn({ month: 1, day: 5, reasons: intervention })],
      [],
      getRange(2026, "year"));
    expect(reasonMix.split).toBeNull();
    expect(describeReasonShift(reasonMix)).toContain("Not enough check-ins");
  });

  it("counts every reason on a multi-reason check-in", () => {
    const { reasonMix } = buildImpactReport(
      [
        checkIn({
          month: 1,
          day: 5,
          reasons: ["Behavior / classroom concerns", "Goal check-in / mentoring"],
        }),
        checkIn({ month: 3, day: 5, reasons: growth }),
      ],
      [],
      getRange(2026, "year"));
    const earlier = reasonMix.categories.find((c) => c.category === "Growth")!;
    expect(earlier.earlierShare).toBe(50);
  });
});

describe("outcomes", () => {
  const resolved: CheckInOutcome = "Issue resolved";
  const planned: CheckInOutcome = "Plan or goal set";

  it("counts recorded outcomes and flags how complete the data is", () => {
    const { outcomes } = buildImpactReport(
      [
        checkIn({ outcome: resolved }),
        checkIn({ outcome: planned }),
        checkIn({ outcome: planned }),
        checkIn(),
      ],
      [],
      getRange(2026, "year"));

    expect(outcomes.recorded).toBe(3);
    expect(outcomes.missing).toBe(1);
    expect(outcomes.recordedShare).toBe(75);
    expect(outcomes.counts[0]).toEqual({
      outcome: planned,
      count: 2,
      share: 67,
    });
  });

  it("handles check-ins logged before outcomes existed", () => {
    const { outcomes } = buildImpactReport([checkIn()], [], getRange(2026, "year"));
    expect(outcomes.recorded).toBe(0);
    expect(outcomes.counts).toEqual([]);
  });
});

describe("buildImpactText", () => {
  it("covers all four measures in one shareable summary", () => {
    const report = buildImpactReport(
      [
        checkIn({
          studentName: "Maria Lopez",
          month: 1,
          day: 8,
          reasons: ["Behavior / classroom concerns"],
          outcome: "Follow-up scheduled",
        }),
        checkIn({
          studentName: "Maria Lopez",
          month: 5,
          day: 8,
          reasons: ["Goal check-in / mentoring"],
          outcome: "Plan or goal set",
        }),
      ],
      [
        session("2026-01-07", ["Andre Bell"]),
        session("2026-05-07", ["Andre Bell", "Devon Carter"]),
      ],
      getRange(2026, "year"));
    const text = buildImpactText(report, settings);

    expect(text).toContain("STUDENT IMPACT SUMMARY");
    expect(text).toContain("Came back more than once: 1 (100%)");
    expect(text).toContain("BOYS GROUP ATTENDANCE");
    expect(text).toContain("Sessions held: 2");
    expect(text).toContain("Growth conversations moved from 0% to 100%");
    expect(text).toContain("Plan or goal set: 1 (50%)");
    expect(text).toContain("School: Riverside High");
  });

  it("keeps check-in notes out of the shared summary", () => {
    const report = buildImpactReport(
      [checkIn({ reasonNotes: "Confidential family detail" })],
      [],
      getRange(2026, "year"));
    expect(buildImpactText(report, settings)).not.toContain(
      "Confidential family detail",
    );
  });

  it("prompts for outcomes when none have been recorded", () => {
    const report = buildImpactReport([checkIn()], [], getRange(2026, "year"));
    expect(buildImpactText(report, settings)).toContain(
      "No outcomes recorded yet",
    );
  });
});
