import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { CHECKINS_KEY, SETTINGS_KEY, clearCheckInCache } from "./storage";
import { DEFAULT_DEBRIEF_SETTINGS, type CheckIn, type FollowUp } from "./types";

const HOUR = 3_600_000;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    studentId: "10482",
    grade: "10",
    classPeriod: "Period 3 — Algebra",
    reasons: ["Behavior / classroom concerns"],
    reasonNotes: "",
    outcome: "Ongoing support",
    createdAt: hoursAgo(2),
    ...overrides,
  };
}

function followUp(overrides: Partial<FollowUp> = {}): FollowUp {
  return {
    dueAt: new Date(Date.now() + 46 * HOUR).toISOString(),
    notes: "",
    services: [],
    careTeamReferral: false,
    ...overrides,
  };
}

function seed(checkIns: CheckIn[]): void {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      ...DEFAULT_DEBRIEF_SETTINGS,
      yourName: "Jordan Reeves",
      schoolName: "Riverside High",
    }),
  );
  clearCheckInCache();
}

function stored(): CheckIn[] {
  return JSON.parse(localStorage.getItem(CHECKINS_KEY) ?? "[]") as CheckIn[];
}

const user = () => userEvent.setup();

async function openTab(
  u: ReturnType<typeof userEvent.setup>,
  name: string | RegExp,
) {
  const nav = screen.getByRole("navigation", { name: "Main" });
  await u.click(within(nav).getByRole("button", { name }));
  const label = typeof name === "string" ? name : name.source;
  if (/Follow-up/.test(label)) {
    await screen.findByRole("heading", { name: "Follow-up" });
  } else if (/Debrief/.test(label)) {
    await screen.findByRole("heading", { name: "Send a debrief" });
  }
}

describe("scheduling a follow-up", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("schedules one 48 hours out from the check-in form", async () => {
    const u = user();
    render(<App />);

    await u.type(screen.getByLabelText("Student name"), "Maria Lopez");
    await u.type(screen.getByLabelText("Student ID (optional)"), "10482");
    await u.type(screen.getByLabelText("Class period"), "Period 3");
    await u.click(
      screen.getByRole("button", { name: "Behavior / classroom concerns" }),
    );
    await u.click(
      screen.getByRole("checkbox", { name: /Follow up within 48 hours/ }),
    );
    await u.click(screen.getByRole("button", { name: "Save check-in" }));

    const saved = stored()[0];
    expect(saved.studentId).toBe("10482");
    expect(saved.followUp).toBeDefined();
    const hoursOut =
      (Date.parse(saved.followUp!.dueAt) - Date.parse(saved.createdAt)) / HOUR;
    expect(hoursOut).toBeCloseTo(48, 1);
  });

  it("schedules one automatically when the outcome says a follow-up is coming", async () => {
    const u = user();
    render(<App />);

    await u.click(screen.getByRole("button", { name: "Follow-up scheduled" }));

    expect(
      screen.getByRole("checkbox", { name: /Follow up within 48 hours/ }),
    ).toBeChecked();
  });

  it("counts outstanding work on the Follow-up tab", async () => {
    seed([checkIn({ followUp: followUp({ dueAt: hoursAgo(3) }) })]);
    const u = user();
    render(<App />);
    await openTab(u, /Follow-up/);

    const overdue = screen.getByText("Overdue", { selector: ".stat-label" });
    expect(overdue.previousSibling).toHaveTextContent("1");
    expect(
      within(screen.getByRole("list", { name: "Overdue" })).getByText(
        /Overdue by 3 hours/,
      ),
    ).toBeInTheDocument();
  });
});

describe("working the follow-up queue", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("records what happened and closes the follow-up", async () => {
    seed([checkIn({ followUp: followUp() })]);
    const u = user();
    render(<App />);
    await openTab(u, /Follow-up/);

    await u.type(
      screen.getByLabelText(/Follow-up notes for Maria Lopez/),
      "Met before first period, back on track.",
    );
    await u.click(screen.getByRole("button", { name: "Mark followed up" }));

    const saved = stored()[0];
    expect(saved.followUp?.completedAt).toBeTruthy();
    expect(saved.followUp?.notes).toBe("Met before first period, back on track.");
    expect(screen.queryByRole("list", { name: "Upcoming" })).toBeNull();
  });

  it("recommends services and refers to the CARE team", async () => {
    seed([checkIn({ followUp: followUp() })]);
    const u = user();
    render(<App />);
    await openTab(u, /Follow-up/);

    await u.click(screen.getByRole("button", { name: "Recommend services" }));
    await u.click(screen.getByRole("button", { name: "Social worker" }));
    await u.click(
      screen.getByRole("checkbox", { name: /Refer to the CARE team/ }),
    );

    const saved = stored()[0];
    expect(saved.followUp?.services).toEqual(["Social worker"]);
    expect(saved.followUp?.careTeamReferral).toBe(true);
  });

  it("records an outcome after the fact, before the debrief goes out", async () => {
    seed([checkIn({ outcome: undefined })]);
    const u = user();
    render(<App />);
    await openTab(u, /Follow-up/);

    const pending = screen.getByRole("list", { name: "Awaiting an outcome" });
    await u.type(
      screen.getByLabelText(/What happened with Maria Lopez/),
      "Apologised to the teacher.",
    );
    await u.click(
      within(pending).getByRole("button", { name: "Issue resolved" }),
    );

    const saved = stored()[0];
    expect(saved.outcome).toBe("Issue resolved");
    expect(saved.outcomeNotes).toBe("Apologised to the teacher.");
  });
});

describe("debrief documents", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("lists follow-ups and student IDs on the daily debrief", async () => {
    seed([
      checkIn({
        followUp: followUp({
          services: ["School counselor"],
          careTeamReferral: true,
        }),
      }),
    ]);
    const u = user();
    render(<App />);
    await openTab(u, "Debrief");

    const preview = screen.getByLabelText("End-of-day debrief preview");
    expect(preview).toHaveTextContent("Student: Maria Lopez (ID 10482)");
    expect(preview).toHaveTextContent("FOLLOW-UPS");
    expect(preview).toHaveTextContent("Recommended: School counselor");
    expect(preview).toHaveTextContent("Referred to the CARE team");
  });

  it("keeps CARE team detail out of the daily debrief", async () => {
    seed([
      checkIn({
        reasonNotes: "Confidential family detail",
        followUp: followUp({
          notes: "Aunt reached by phone",
          careTeamReferral: true,
        }),
      }),
    ]);
    const u = user();
    render(<App />);
    await openTab(u, "Debrief");

    const preview = screen.getByLabelText("End-of-day debrief preview");
    expect(preview).not.toHaveTextContent("Aunt reached by phone");
    expect(preview).toHaveTextContent(
      "1 student referred to the CARE team. Detail is in the separate CARE team debrief",
    );
  });

  it("builds the attendance clerk list for today", async () => {
    seed([checkIn({ studentName: "Andre Bell", studentId: "10517" })]);
    const u = user();
    render(<App />);
    await openTab(u, "Debrief");
    await u.click(screen.getByRole("button", { name: /Attendance clerk list/ }));

    const preview = screen.getByLabelText("Attendance clerk list preview");
    expect(preview).toHaveTextContent("STUDENT CHECK-IN LIST — ATTENDANCE CLERK");
    expect(preview).toHaveTextContent("Andre Bell");
    expect(preview).toHaveTextContent("ID 10517");
  });

  it("summarises the week", async () => {
    seed([
      checkIn({ studentName: "Maria Lopez", createdAt: hoursAgo(2) }),
      checkIn({ studentName: "Maria Lopez", createdAt: hoursAgo(3) }),
    ]);
    const u = user();
    render(<App />);
    await openTab(u, "Debrief");
    await u.click(screen.getByRole("button", { name: /Weekly summary/ }));

    const preview = screen.getByLabelText("Weekly summary preview");
    expect(preview).toHaveTextContent("WEEKLY CHECK-IN SUMMARY");
    expect(preview).toHaveTextContent("Check-ins: 2");
    expect(preview).toHaveTextContent("Maria Lopez: 2 check-ins");
  });

  it("gives the CARE team its own document", async () => {
    seed([
      checkIn({
        studentName: "Devon Carter",
        reasonNotes: "Staying with an aunt",
        followUp: followUp({
          services: ["Social worker"],
          notes: "Aunt reached by phone",
          careTeamReferral: true,
        }),
      }),
      checkIn({ studentName: "Not referred" }),
    ]);
    const u = user();
    render(<App />);
    await openTab(u, "Debrief");
    await u.click(screen.getByRole("button", { name: /CARE team referrals/ }));

    const preview = screen.getByLabelText("CARE team referrals preview");
    expect(preview).toHaveTextContent("CONFIDENTIAL");
    expect(preview).toHaveTextContent("Devon Carter");
    expect(preview).toHaveTextContent("Aunt reached by phone");
    expect(preview).not.toHaveTextContent("Not referred");
  });
});
