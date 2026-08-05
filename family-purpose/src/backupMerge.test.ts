import { describe, expect, it } from "vitest";
import { BACKUP_FORMAT, type Backup } from "./backup";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";
import { countNewCheckIns, mergeBackups } from "./backupMerge";

const base: Backup = {
  format: BACKUP_FORMAT,
  version: 1,
  exportedAt: "2026-07-30T12:00:00.000Z",
  settings: DEFAULT_DEBRIEF_SETTINGS,
  checkIns: [
    {
      id: "a",
      studentName: "Maria Lopez",
      grade: "10",
      classPeriod: "Period 3",
      reasons: ["Academic support / tutoring"],
      reasonNotes: "",
      createdAt: "2026-07-30T10:00:00.000Z",
    },
  ],
  groupMembers: [{ name: "Maria Lopez", grade: "10" }],
  groupSessions: [],
};

describe("mergeBackups", () => {
  it("keeps check-ins from both devices", () => {
    const incoming: Backup = {
      ...base,
      exportedAt: "2026-07-30T14:00:00.000Z",
      checkIns: [
        {
          id: "b",
          studentName: "Devon Carter",
          grade: "9",
          classPeriod: "Period 2",
          reasons: ["Attendance / tardiness"],
          reasonNotes: "",
          createdAt: "2026-07-30T11:00:00.000Z",
        },
      ],
      groupMembers: [{ name: "Devon Carter", grade: "9" }],
    };

    const merged = mergeBackups(base, incoming);
    expect(merged.checkIns).toHaveLength(2);
    expect(merged.groupMembers).toHaveLength(2);
    expect(merged.settings).toBe(base.settings);
  });

  it("prefers the newer record when ids collide", () => {
    const incoming: Backup = {
      ...base,
      checkIns: [
        {
          ...base.checkIns[0],
          reasonNotes: "Updated on phone",
          createdAt: "2026-07-30T15:00:00.000Z",
        },
      ],
    };

    const merged = mergeBackups(base, incoming);
    expect(merged.checkIns[0].reasonNotes).toBe("Updated on phone");
  });
});

describe("countNewCheckIns", () => {
  it("counts ids that only exist on the incoming backup", () => {
    const incoming: Backup = {
      ...base,
      checkIns: [
        ...base.checkIns,
        {
          id: "b",
          studentName: "Devon Carter",
          grade: "9",
          classPeriod: "Period 2",
          reasons: ["Attendance / tardiness"],
          reasonNotes: "",
          createdAt: "2026-07-30T11:00:00.000Z",
        },
      ],
    };
    expect(countNewCheckIns(base, incoming)).toBe(1);
  });
});
