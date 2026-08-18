import { describe, expect, it } from "vitest";
import {
  buildFollowUpQueue,
  careTeamReferrals,
  createFollowUp,
  formatDueLabel,
  followUpState,
  needsOutcome,
  studentLabel,
} from "./followups";
import { FOLLOW_UP_WINDOW_HOURS, type CheckIn, type FollowUp } from "./types";

const HOUR = 3_600_000;

function hoursFromNow(hours: number, now = Date.now()): string {
  return new Date(now + hours * HOUR).toISOString();
}

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "10",
    classPeriod: "Period 3",
    reasons: ["Behavior / classroom concerns"],
    reasonNotes: "",
    createdAt: hoursFromNow(-1),
    ...overrides,
  };
}

function withFollowUp(
  dueInHours: number,
  overrides: Partial<FollowUp> = {},
  checkInOverrides: Partial<CheckIn> = {},
): CheckIn {
  return checkIn({
    ...checkInOverrides,
    followUp: {
      dueAt: hoursFromNow(dueInHours),
      notes: "",
      services: [],
      careTeamReferral: false,
      ...overrides,
    },
  });
}

describe("createFollowUp", () => {
  it("falls due 48 hours after the check-in", () => {
    const createdAt = "2026-03-02T14:00:00.000Z";
    const followUp = createFollowUp(createdAt);

    expect(Date.parse(followUp.dueAt) - Date.parse(createdAt)).toBe(
      FOLLOW_UP_WINDOW_HOURS * HOUR,
    );
    expect(followUp.completedAt).toBeUndefined();
    expect(followUp.services).toEqual([]);
    expect(followUp.careTeamReferral).toBe(false);
  });
});

describe("followUpState", () => {
  const now = new Date("2026-03-04T12:00:00.000Z");

  it("is overdue once the deadline passes", () => {
    expect(
      followUpState(
        { dueAt: "2026-03-04T11:00:00.000Z", notes: "", services: [], careTeamReferral: false },
        now,
      ),
    ).toBe("overdue");
  });

  it("is done regardless of the deadline once completed", () => {
    expect(
      followUpState(
        {
          dueAt: "2026-03-01T11:00:00.000Z",
          completedAt: "2026-03-02T09:00:00.000Z",
          notes: "",
          services: [],
          careTeamReferral: false,
        },
        now,
      ),
    ).toBe("done");
  });
});

describe("buildFollowUpQueue", () => {
  it("sorts work into overdue, due today and upcoming", () => {
    const queue = buildFollowUpQueue([
      withFollowUp(-30, {}, { studentName: "Overdue Student" }),
      withFollowUp(2, {}, { studentName: "Due Student" }),
      withFollowUp(40, {}, { studentName: "Upcoming Student" }),
      checkIn({ studentName: "No Follow-up" }),
    ]);

    expect(queue.overdue.map((i) => i.checkIn.studentName)).toEqual([
      "Overdue Student",
    ]);
    expect(queue.open).toHaveLength(3);
    expect(queue.done).toHaveLength(0);
  });

  it("puts the most pressing deadline first", () => {
    const queue = buildFollowUpQueue([
      withFollowUp(-2, {}, { studentName: "Late" }),
      withFollowUp(-30, {}, { studentName: "Later" }),
    ]);
    expect(queue.overdue.map((i) => i.checkIn.studentName)).toEqual([
      "Later",
      "Late",
    ]);
  });

  it("moves a completed follow-up out of the open list", () => {
    const queue = buildFollowUpQueue([
      withFollowUp(-30, { completedAt: hoursFromNow(-1) }),
    ]);
    expect(queue.open).toHaveLength(0);
    expect(queue.done).toHaveLength(1);
  });
});

describe("needsOutcome", () => {
  it("lists recent check-ins with no outcome, newest first", () => {
    const list = needsOutcome([
      checkIn({ studentName: "Older", createdAt: hoursFromNow(-30) }),
      checkIn({ studentName: "Newer", createdAt: hoursFromNow(-2) }),
      checkIn({ studentName: "Done", outcome: "Issue resolved" }),
    ]);
    expect(list.map((c) => c.studentName)).toEqual(["Newer", "Older"]);
  });

  it("drops blanks older than the window", () => {
    const list = needsOutcome([
      checkIn({ studentName: "Ancient", createdAt: hoursFromNow(-24 * 30) }),
    ]);
    expect(list).toHaveLength(0);
  });
});

describe("careTeamReferrals", () => {
  it("picks out only the students flagged for the CARE team", () => {
    const referrals = careTeamReferrals([
      withFollowUp(2, { careTeamReferral: true }, { studentName: "Referred" }),
      withFollowUp(2, {}, { studentName: "Not referred" }),
      checkIn({ studentName: "No follow-up" }),
    ]);
    expect(referrals.map((c) => c.studentName)).toEqual(["Referred"]);
  });
});

describe("formatDueLabel", () => {
  const base = { notes: "", services: [], careTeamReferral: false };

  it("counts down in hours inside a day", () => {
    expect(formatDueLabel({ ...base, dueAt: hoursFromNow(5) })).toBe(
      "Due in 5 hours",
    );
  });

  it("reports how far past the deadline it is", () => {
    expect(formatDueLabel({ ...base, dueAt: hoursFromNow(-49) })).toBe(
      "Overdue by 2 days",
    );
  });

  it("uses the singular for one hour", () => {
    expect(formatDueLabel({ ...base, dueAt: hoursFromNow(-1) })).toBe(
      "Overdue by 1 hour",
    );
  });

  it("says when a follow-up was completed", () => {
    expect(
      formatDueLabel({
        ...base,
        dueAt: hoursFromNow(-2),
        completedAt: hoursFromNow(-1),
      }),
    ).toContain("Followed up");
  });
});

describe("studentLabel", () => {
  it("adds the student ID when one is on file", () => {
    expect(studentLabel(checkIn({ studentId: "10482" }))).toBe(
      "Maria Lopez (ID 10482)",
    );
  });

  it("falls back to the name alone", () => {
    expect(studentLabel(checkIn())).toBe("Maria Lopez");
    expect(studentLabel(checkIn({ studentId: "  " }))).toBe("Maria Lopez");
  });
});
