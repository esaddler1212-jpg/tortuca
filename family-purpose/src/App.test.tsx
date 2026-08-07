import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { CHECKINS_KEY, clearCheckInCache } from "./storage";
import type { CheckIn } from "./types";

function seed(checkIns: CheckIn[]): void {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
  clearCheckInCache();
}

function historyEntry(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "7",
    classPeriod: "Period 3 — Algebra",
    reasons: ["Academic support / tutoring"],
    reasonNotes: "",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    ...overrides,
  };
}

function nameField(): HTMLInputElement {
  return screen.getByLabelText("Student name") as HTMLInputElement;
}

function periodField(): HTMLInputElement {
  return screen.getByLabelText("Class period") as HTMLInputElement;
}

function gradeField(): HTMLSelectElement {
  return screen.getByLabelText("Grade") as HTMLSelectElement;
}

function recentStudentPill(name: string): HTMLElement {
  const group = screen.getByLabelText("Recent students — tap to fill");
  return within(group).getByRole("button", { name: new RegExp(name) });
}

describe("quick check-in entry", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("fills name, grade and period from a recent-student pill", async () => {
    seed([
      historyEntry({
        studentName: "Maria Lopez",
        grade: "7",
        classPeriod: "Period 3 — Algebra",
      }),
    ]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(recentStudentPill("Maria Lopez"));

    expect(nameField()).toHaveValue("Maria Lopez");
    expect(gradeField()).toHaveValue("7");
    expect(periodField()).toHaveValue("Period 3 — Algebra");
  });

  it("fills grade and period when a known name is typed", async () => {
    seed([
      historyEntry({
        studentName: "Andre Bell",
        grade: "8",
        classPeriod: "Period 5 — Biology",
      }),
    ]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(nameField(), "andre bell");

    expect(gradeField()).toHaveValue("8");
    expect(periodField()).toHaveValue("Period 5 — Biology");
  });

  it("completes a partial name from the suggestion list", async () => {
    seed([
      historyEntry({
        studentName: "Andre Bell",
        grade: "8",
        classPeriod: "Period 5 — Biology",
      }),
    ]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(nameField(), "and");
    const matches = screen.getByRole("list", { name: "Matching students" });
    await user.click(within(matches).getByRole("button", { name: /Andre Bell/ }));

    expect(nameField()).toHaveValue("Andre Bell");
    expect(gradeField()).toHaveValue("8");
    expect(periodField()).toHaveValue("Period 5 — Biology");
  });

  it("keeps grade and period after saving so the next student needs only a name", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(nameField(), "Maria Lopez");
    await user.selectOptions(gradeField(), "7");
    await user.clear(periodField());
    await user.type(periodField(), "Period 3 — Algebra");
    await user.click(
      screen.getByRole("button", { name: "Academic support / tutoring" }),
    );
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    expect(nameField()).toHaveValue("");
    expect(gradeField()).toHaveValue("7");
    expect(periodField()).toHaveValue("Period 3 — Algebra");

    await user.type(nameField(), "Devon Carter");
    await user.click(
      screen.getByRole("button", { name: "Behavior / classroom concerns" }),
    );
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    const list = screen.getByRole("list", { name: "Today's check-ins" });
    expect(within(list).getByText("Devon Carter")).toBeInTheDocument();
    expect(
      within(list).getAllByText(/Grade 7 · Period 3 — Algebra/),
    ).toHaveLength(2);
  });

  it("sets the class period from a recent-period pill", async () => {
    seed([historyEntry({ classPeriod: "Period 5 — Biology" })]);
    const user = userEvent.setup();
    render(<App />);

    const group = screen.getByLabelText("Recent periods");
    await user.click(
      within(group).getByRole("button", { name: "Period 5 — Biology" }),
    );

    expect(periodField()).toHaveValue("Period 5 — Biology");
  });

  it("clears the name in state when Escape is pressed", async () => {
    seed([historyEntry({ studentName: "Maria Lopez" })]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(recentStudentPill("Maria Lopez"));
    expect(nameField()).toHaveValue("Maria Lopez");

    nameField().focus();
    await user.keyboard("{Escape}");

    expect(nameField()).toHaveValue("");
  });

  it("marks reason pills as pressed when selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    const pill = screen.getByRole("button", { name: "Attendance / tardiness" });
    expect(pill).toHaveAttribute("aria-pressed", "false");
    await user.click(pill);
    expect(pill).toHaveAttribute("aria-pressed", "true");
  });

  it("orders reason pills by how often they are used", async () => {
    seed([
      historyEntry({ reasons: ["Attendance / tardiness"] }),
      historyEntry({ reasons: ["Attendance / tardiness"] }),
    ]);
    render(<App />);

    const group = screen.getByLabelText("Reason(s) for check-in");
    const first = within(group).getAllByRole("button")[0];
    expect(first).toHaveTextContent("Attendance / tardiness");
  });

  it("refuses to save without a reason", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(nameField(), "Maria Lopez");
    await user.type(periodField(), "Period 3 — Algebra");
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    expect(
      screen.getByText(/Select at least one reason or add notes/),
    ).toBeInTheDocument();
  });

  it("warns when a student is logged twice in one day", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(nameField(), "Maria Lopez");
    await user.type(periodField(), "Period 3 — Algebra");
    await user.click(
      screen.getByRole("button", { name: "Academic support / tutoring" }),
    );
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    await user.type(nameField(), "maria lopez");

    expect(screen.getByText(/Already checked in today/)).toBeInTheDocument();
  });
});
