import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import {
  CHECKINS_KEY,
  GROUP_SESSIONS_KEY,
  clearCheckInCache,
} from "./storage";
import type { CheckIn, GroupSession } from "./types";

const YEAR = new Date().getFullYear();

function day(month: number, date: number): string {
  return `${YEAR}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

function checkIn(overrides: Partial<CheckIn> & { on?: string } = {}): CheckIn {
  const { on = day(1, 8), ...rest } = overrides;
  const [y, m, d] = on.split("-").map(Number);
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "10",
    classPeriod: "Period 3",
    reasons: ["Behavior / classroom concerns"],
    reasonNotes: "",
    createdAt: new Date(y, m - 1, d, 12).toISOString(),
    ...rest,
  };
}

function session(date: string, attendees: string[]): GroupSession {
  return {
    id: crypto.randomUUID(),
    date,
    topic: "Goal setting",
    notes: "",
    attendees,
    updatedAt: `${date}T15:00:00.000Z`,
  };
}

function seed(checkIns: CheckIn[], sessions: GroupSession[] = []): void {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
  localStorage.setItem(GROUP_SESSIONS_KEY, JSON.stringify(sessions));
  clearCheckInCache();
}

async function openImpact(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Impact" }));
}

describe("Impact tab", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("shows how many students came back", async () => {
    seed([
      checkIn({ studentName: "Maria Lopez", on: day(1, 8) }),
      checkIn({ studentName: "Maria Lopez", on: day(2, 8) }),
      checkIn({ studentName: "Andre Bell", grade: "11", on: day(2, 9) }),
    ]);
    const user = userEvent.setup();
    render(<App />);
    await openImpact(user);

    const table = screen.getByRole("table", { name: "Returning students" });
    const maria = within(table).getByText("Maria Lopez").closest("tr")!;
    expect(within(maria).getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Returned (1 students)")).toBeInTheDocument();
  });

  it("reports the group attendance trend and per-member rates", async () => {
    seed(
      [],
      [
        session(day(1, 7), ["Andre Bell"]),
        session(day(2, 7), ["Andre Bell", "Devon Carter"]),
      ],
    );
    const user = userEvent.setup();
    render(<App />);
    await openImpact(user);

    const card = screen
      .getByRole("heading", { name: /attendance trend/i })
      .closest(".card") as HTMLElement;
    expect(within(card).getByText(/Attendance is up/)).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Attendance by member" });
    const devon = within(table).getByText("Devon Carter").closest("tr")!;
    expect(within(devon).getByText("1 of 2")).toBeInTheDocument();
    expect(within(devon).getByText("50%")).toBeInTheDocument();
  });

  it("shows reasons shifting from intervention toward growth", async () => {
    seed([
      checkIn({ on: day(1, 8), reasons: ["Behavior / classroom concerns"] }),
      checkIn({ on: day(6, 8), reasons: ["Goal check-in / mentoring"] }),
    ]);
    const user = userEvent.setup();
    render(<App />);
    await openImpact(user);

    const table = screen.getByRole("table", { name: "Reason mix over time" });
    const growth = within(table).getByText("Growth").closest("tr")!;
    expect(within(growth).getByText("+100 pts")).toBeInTheDocument();
    const intervention = within(table).getByText("Intervention").closest("tr")!;
    expect(within(intervention).getByText("-100 pts")).toBeInTheDocument();
  });

  it("narrows the numbers to the selected quarter", async () => {
    seed([
      checkIn({ studentName: "Maria Lopez", on: day(2, 8) }),
      checkIn({ studentName: "Andre Bell", on: day(5, 8) }),
    ]);
    const user = userEvent.setup();
    render(<App />);
    await openImpact(user);

    await user.selectOptions(screen.getByLabelText("Period"), `cal:${YEAR}:q2`);

    const table = screen.getByRole("table", { name: "Returning students" });
    expect(within(table).getByText("Andre Bell")).toBeInTheDocument();
    expect(within(table).queryByText("Maria Lopez")).not.toBeInTheDocument();
  });

  it("prompts for outcomes until some are recorded", async () => {
    seed([checkIn()]);
    const user = userEvent.setup();
    render(<App />);
    await openImpact(user);

    expect(
      screen.getByText(/No outcomes recorded in this period/),
    ).toBeInTheDocument();
  });

  it("carries an outcome from the check-in form into the impact breakdown", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Student name"), "Maria Lopez");
    await user.type(screen.getByLabelText("Class period"), "Period 3");
    await user.click(
      screen.getByRole("button", { name: "Goal check-in / mentoring" }),
    );
    await user.click(screen.getByRole("button", { name: "Plan or goal set" }));
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    await openImpact(user);

    const table = screen.getByRole("table", { name: "Outcomes" });
    const row = within(table).getByText("Plan or goal set").closest("tr")!;
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(within(row).getByText("100%")).toBeInTheDocument();
  });

  it("leaves the outcome unset unless one is tapped", async () => {
    const user = userEvent.setup();
    render(<App />);

    const outcome = screen.getByRole("button", { name: "Issue resolved" });
    expect(outcome).toHaveAttribute("aria-pressed", "false");
    await user.click(outcome);
    expect(outcome).toHaveAttribute("aria-pressed", "true");
    await user.click(outcome);
    expect(outcome).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps check-in notes out of the shareable summary", async () => {
    seed([checkIn({ reasonNotes: "Confidential family detail" })]);
    const user = userEvent.setup();
    render(<App />);
    await openImpact(user);

    const preview = screen.getByLabelText("Impact summary preview");
    expect(preview).toHaveTextContent("STUDENT IMPACT SUMMARY");
    expect(preview).not.toHaveTextContent("Confidential family detail");
  });
});
