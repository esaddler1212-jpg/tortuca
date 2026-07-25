import { describe, expect, it } from "vitest";
import { buildDebriefText, buildMailtoUrl } from "./debrief";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";

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

function makeSession(overrides: Partial<GroupSession> = {}): GroupSession {
  return {
    id: crypto.randomUUID(),
    date: "2026-07-25",
    topic: "Goal setting",
    notes: "",
    attendees: ["Andre Bell", "Devon Carter"],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "9",
    classPeriod: "Period 3 — Algebra",
    reasons: ["Academic support / tutoring"],
    reasonNotes: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildDebriefText", () => {
  it("includes each student with grade, period and reasons", () => {
    const text = buildDebriefText(
      [
        makeCheckIn({ studentName: "Andre Bell", grade: "11" }),
        makeCheckIn({
          studentName: "Maria Lopez",
          reasonNotes: "Following up on missed work",
        }),
      ],
      settings,
    );

    expect(text).toContain("Total student check-ins today: 2");
    expect(text).toContain("Student: Andre Bell");
    expect(text).toContain("Grade: 11");
    expect(text).toContain("Period 3 — Algebra");
    expect(text).toContain("Notes: Following up on missed work");
  });

  it("lists students alphabetically", () => {
    const text = buildDebriefText(
      [
        makeCheckIn({ studentName: "Zoe Nunez" }),
        makeCheckIn({ studentName: "Andre Bell" }),
      ],
      settings,
    );
    expect(text.indexOf("Andre Bell")).toBeLessThan(text.indexOf("Zoe Nunez"));
  });

  it("credits the preparer and school", () => {
    const text = buildDebriefText([makeCheckIn()], settings);
    expect(text).toContain("School: Riverside High");
    expect(text).toContain("Prepared by: Jordan Reeves (Community mentor)");
  });

  it("explains when nothing was logged", () => {
    const text = buildDebriefText([], settings);
    expect(text).toContain("Total student check-ins today: 0");
    expect(text).toContain("No student check-ins were logged");
  });

  it("adds the group session when members signed in", () => {
    const text = buildDebriefText([makeCheckIn()], settings, makeSession());
    expect(text).toContain("BOYS Group signed in today: 2");
    expect(text).toContain("BOYS GROUP SESSION");
    expect(text).toContain("Focus: Goal setting");
    expect(text).toContain("Signed in (2): Andre Bell, Devon Carter");
  });

  it("reports a group session even on a day with no check-ins", () => {
    const text = buildDebriefText([], settings, makeSession());
    expect(text).not.toContain("No student check-ins were logged");
    expect(text).toContain("Signed in (2)");
  });

  it("leaves out the group section when nobody signed in", () => {
    const text = buildDebriefText(
      [makeCheckIn()],
      settings,
      makeSession({ attendees: [], topic: "", notes: "" }),
    );
    expect(text).not.toContain("BOYS GROUP SESSION");
  });
});

describe("buildMailtoUrl", () => {
  it("joins recipients and skips blanks", () => {
    const url = buildMailtoUrl(
      ["counselor@school.edu", "", "supervisor@company.com"],
      "Subject",
      "Body",
    );
    expect(url).toContain(
      "to=counselor%40school.edu%2Csupervisor%40company.com",
    );
    expect(url).toContain("subject=Subject");
  });

  it("omits the recipient list when no emails are set", () => {
    expect(buildMailtoUrl(["", "  "], "Subject", "Body")).not.toContain("to=");
  });
});
