import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import {
  CHECKINS_KEY,
  GROUP_MEMBERS_KEY,
  GROUP_SESSIONS_KEY,
  clearCheckInCache,
  loadGroupSessions,
  todayKey,
} from "./storage";
import type { GroupMember, GroupSession } from "./types";

function seedMembers(members: GroupMember[]): void {
  localStorage.setItem(GROUP_MEMBERS_KEY, JSON.stringify(members));
}

function seedSessions(sessions: GroupSession[]): void {
  localStorage.setItem(GROUP_SESSIONS_KEY, JSON.stringify(sessions));
}

async function openGroupTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Group" }));
  await screen.findByRole("heading", { name: /sign-in$/i });
}

describe("group sign-in", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("signs a member in and out, saving each tap", async () => {
    seedMembers([
      { name: "Andre Bell", grade: "11" },
      { name: "Devon Carter", grade: "10" },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    const group = screen.getByLabelText("Tap a name to sign in");
    const andre = within(group).getByRole("button", { name: /Andre Bell/ });

    expect(andre).toHaveAttribute("aria-pressed", "false");
    await user.click(andre);
    expect(
      within(group).getByRole("button", { name: /Andre Bell/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(loadGroupSessions()[0].attendees).toEqual(["Andre Bell"]);

    await user.click(
      within(group).getByRole("button", { name: /Andre Bell/ }),
    );
    expect(loadGroupSessions()[0].attendees).toEqual([]);
  });

  it("shows how many of the roster have signed in", async () => {
    seedMembers([
      { name: "Andre Bell", grade: "11" },
      { name: "Devon Carter", grade: "10" },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    expect(screen.getByText(/0 of 2 signed in/)).toBeInTheDocument();
    await user.click(
      within(screen.getByLabelText("Tap a name to sign in")).getByRole(
        "button",
        { name: /Devon Carter/ },
      ),
    );
    expect(screen.getByText(/1 of 2 signed in/)).toBeInTheDocument();
  });

  it("records the session focus", async () => {
    seedMembers([{ name: "Andre Bell", grade: "11" }]);
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    await user.type(screen.getByLabelText("Today's focus"), "Conflict repair");

    expect(loadGroupSessions()[0].topic).toBe("Conflict repair");
    expect(loadGroupSessions()[0].date).toBe(todayKey());
  });

  it("adds and removes roster members", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    await user.click(screen.getByRole("button", { name: "Manage roster" }));
    await user.type(screen.getByLabelText("Add a student"), "Priya Raman");
    await user.selectOptions(screen.getByLabelText("Grade"), "8");
    await user.click(screen.getByRole("button", { name: "Add to roster" }));

    const signIn = screen.getByLabelText("Tap a name to sign in");
    expect(
      within(signIn).getByRole("button", { name: /Priya Raman/ }),
    ).toBeInTheDocument();

    const rosterList = screen.getByLabelText("BOYS Group members");
    await user.click(within(rosterList).getByRole("button", { name: "Remove" }));
    expect(screen.getByText(/No members yet/)).toBeInTheDocument();
  });

  it("refuses to add the same student twice", async () => {
    seedMembers([{ name: "Andre Bell", grade: "11" }]);
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    await user.click(screen.getByRole("button", { name: "Manage roster" }));
    await user.type(screen.getByLabelText("Add a student"), "andre bell");
    await user.click(screen.getByRole("button", { name: "Add to roster" }));

    expect(screen.getByText(/already on the roster/)).toBeInTheDocument();
  });

  it("lists earlier sessions with their attendance", async () => {
    seedMembers([{ name: "Andre Bell", grade: "11" }]);
    seedSessions([
      {
        id: "past",
        date: "2026-01-14",
        topic: "Study habits",
        notes: "",
        attendees: ["Andre Bell", "Devon Carter"],
        updatedAt: "2026-01-14T18:00:00.000Z",
      },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    const past = screen.getByLabelText("Recent group sessions");
    expect(within(past).getByText(/2 signed in · Study habits/)).toBeInTheDocument();
  });

  it("carries today's sign-ins into the debrief", async () => {
    seedMembers([{ name: "Andre Bell", grade: "11" }]);
    const user = userEvent.setup();
    render(<App />);
    await openGroupTab(user);

    await user.click(
      within(screen.getByLabelText("Tap a name to sign in")).getByRole(
        "button",
        { name: /Andre Bell/ },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Debrief" }));
    await screen.findByRole("heading", { name: "Send a debrief" });

    const preview = screen.getByLabelText("End-of-day debrief preview");
    expect(preview).toHaveTextContent("BOYS Group signed in today: 1");
    expect(preview).toHaveTextContent("Signed in (1): Andre Bell");
  });
});

describe("reports tab", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("summarises the selected period", async () => {
    const year = new Date().getFullYear();
    localStorage.setItem(
      CHECKINS_KEY,
      JSON.stringify([
        {
          id: "c1",
          studentName: "Maria Lopez",
          grade: "10",
          classPeriod: "Period 3",
          reasons: ["Attendance / tardiness"],
          reasonNotes: "private detail",
          createdAt: new Date(year, 1, 10, 12).toISOString(),
        },
        {
          id: "c2",
          studentName: "Andre Bell",
          grade: "11",
          classPeriod: "Period 5",
          reasons: ["Attendance / tardiness"],
          reasonNotes: "",
          createdAt: new Date(year, 1, 11, 12).toISOString(),
        },
      ]),
    );
    clearCheckInCache();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Reports" }));
    await screen.findByLabelText("Period");
    await user.selectOptions(screen.getByLabelText("Period"), `cal:${year}:q1`);

    const preview = screen.getByLabelText("Summary preview");
    expect(preview).toHaveTextContent("Total check-ins: 2");
    expect(preview).toHaveTextContent("Students served: 2");
    expect(preview).toHaveTextContent("Attendance / tardiness: 2 (100%)");
    expect(preview).not.toHaveTextContent("private detail");

    await user.selectOptions(screen.getByLabelText("Period"), `cal:${year}:q3`);
    expect(screen.getByLabelText("Summary preview")).toHaveTextContent(
      "Total check-ins: 0",
    );
  });
});
