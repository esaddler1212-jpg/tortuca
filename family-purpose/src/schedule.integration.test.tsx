import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { CHECKINS_KEY, clearCheckInCache } from "./storage";
import type { CheckIn } from "./types";

/** A local moment, so the bell schedule sees the hour we intend. */
function moment(day: string, hour: number, minute = 0): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, hour, minute);
}

function freeze(day: string, hour: number, minute = 0): void {
  vi.setSystemTime(moment(day, hour, minute));
}

function seed(checkIns: CheckIn[]): void {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
  clearCheckInCache();
}

function checkIn(day: string, overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: crypto.randomUUID(),
    studentName: "Maria Lopez",
    grade: "7",
    classPeriod: "Period 3",
    reasons: ["Academic support / tutoring"],
    reasonNotes: "",
    createdAt: moment(day, 10, 15).toISOString(),
    ...overrides,
  };
}

function periodField(): HTMLInputElement {
  return screen.getByLabelText("Class period") as HTMLInputElement;
}

function banner(): HTMLElement {
  return document.querySelector(".schedule-banner") as HTMLElement;
}

const TUESDAY = "2026-09-15";
const WEDNESDAY = "2026-09-16";
const MINIMUM_DAY = "2026-12-01";
const LABOR_DAY = "2026-09-07";

describe("the bell schedule on the log tab", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fills in the period in session", () => {
    freeze(TUESDAY, 10, 15);
    render(<App />);

    expect(periodField()).toHaveValue("Period 3");
    expect(banner()).toHaveTextContent("Period 3 now · 10:02 AM–10:44 AM");
    expect(banner()).toHaveTextContent("7th & 8th grade");
  });

  it("follows the early-release clock on Wednesday", () => {
    freeze(WEDNESDAY, 10, 15);
    render(<App />);

    expect(periodField()).toHaveValue("Period 4");
    expect(banner()).toHaveTextContent("Early release — ends 12:43 PM");
  });

  it("follows the minimum-day clock", () => {
    freeze(MINIMUM_DAY, 10, 15);
    render(<App />);

    expect(periodField()).toHaveValue("Period 4");
    expect(banner()).toHaveTextContent("Minimum day — ends 12:00 PM");
  });

  it("names the period just finished during passing", () => {
    freeze(TUESDAY, 9, 59);
    render(<App />);

    expect(banner()).toHaveTextContent("Passing period — Period 2 just ended");
  });

  it("gives 6th grade the earlier lunch", async () => {
    freeze(TUESDAY, 11, 45);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // A 7th grader is in 5th period; a 6th grader is at lunch, so the period
    // they came from is offered instead.
    expect(periodField()).toHaveValue("Period 5");

    await user.selectOptions(screen.getByLabelText("Grade"), "6");
    expect(periodField()).toHaveValue("Period 4");
  });

  it("says when school is closed and suggests no period", () => {
    freeze(LABOR_DAY, 10, 15);
    render(<App />);

    expect(periodField()).toHaveValue("");
    expect(banner()).toHaveTextContent("No school — Labor Day");
    expect(banner()).toHaveTextContent("School resumes Tuesday, September 8");
  });

  it("flags the end of a quarter", () => {
    freeze("2026-10-02", 10, 15);
    render(<App />);

    expect(banner()).toHaveTextContent("End of Quarter 1");
  });

  it("keeps a period typed by hand", async () => {
    freeze(TUESDAY, 10, 15);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.clear(periodField());
    await user.type(periodField(), "Period 3 — Algebra");
    await user.selectOptions(screen.getByLabelText("Grade"), "6");

    expect(periodField()).toHaveValue("Period 3 — Algebra");
  });

  it("offers every period of the day as a pill", async () => {
    freeze(TUESDAY, 10, 15);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    const pills = screen.getByLabelText(
      "Bell schedule — 7th & 8th grade — Mon, Tue, Thu, Fri",
    );
    expect(within(pills).getByRole("button", { name: /Advisory/ })).toBeInTheDocument();
    expect(
      within(pills).getByRole("button", { name: /Period 3.*happening now/ }),
    ).toBeInTheDocument();
    expect(
      within(pills).queryByRole("button", { name: /Lunch/ }),
    ).not.toBeInTheDocument();

    await user.click(
      within(pills).getByRole("button", { name: /Period 7, 1:36 PM/ }),
    );
    expect(periodField()).toHaveValue("Period 7");
  });
});

describe("school terms in reporting", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on the quarter in progress", async () => {
    freeze(TUESDAY, 15);
    seed([checkIn(TUESDAY)]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Reports" }));

    expect(screen.getByLabelText("Period")).toHaveValue("term:q1");
    expect(screen.getByLabelText("Summary preview")).toHaveTextContent(
      "Quarter 1 · 2026–2027",
    );
  });

  it("splits check-ins across the district's quarters", async () => {
    freeze("2027-01-20", 15);
    seed([
      checkIn("2026-09-15", { studentName: "Maria Lopez" }),
      checkIn("2026-11-10", { studentName: "Andre Bell" }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Reports" }));

    await user.selectOptions(screen.getByLabelText("Period"), "term:q1");
    expect(screen.getByLabelText("Summary preview")).toHaveTextContent(
      "Total check-ins: 1",
    );

    await user.selectOptions(screen.getByLabelText("Period"), "term:s1");
    expect(screen.getByLabelText("Summary preview")).toHaveTextContent(
      "Total check-ins: 2",
    );

    await user.selectOptions(screen.getByLabelText("Period"), "term:q3");
    expect(screen.getByLabelText("Summary preview")).toHaveTextContent(
      "Total check-ins: 0",
    );
  });

  it("still offers calendar quarters", async () => {
    freeze(TUESDAY, 15);
    seed([checkIn(TUESDAY)]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Reports" }));
    await user.selectOptions(screen.getByLabelText("Period"), "cal:2026:q3");

    expect(screen.getByLabelText("Summary preview")).toHaveTextContent(
      "Q3 (Jul–Sep) 2026",
    );
  });
});

describe("the schedule reference in settings", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    freeze(TUESDAY, 10, 15);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the schedule in effect today and lets you browse the others", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));

    const table = screen.getByRole("table", {
      name: "7th & 8th grade — Mon, Tue, Thu, Fri",
    });
    expect(within(table).getByText("Advisory")).toBeInTheDocument();
    expect(within(table).getByText("Lunch")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Minimum day/ }));
    const minimum = screen.getByRole("table", {
      name: "Minimum day — all grades",
    });
    const lastPeriod = within(minimum).getByText("Period 7").closest("tr")!;
    expect(within(lastPeriod).getByText("12:00 PM")).toBeInTheDocument();
  });

  it("lists the district's terms", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));

    const terms = screen.getByRole("table", { name: "School terms" });
    const q1 = within(terms).getByText("Quarter 1").closest("tr")!;
    expect(within(q1).getByText("41")).toBeInTheDocument();
    expect(q1).toHaveTextContent("Aug 6, 2026 – Oct 2, 2026");
  });
});
