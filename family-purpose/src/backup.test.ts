import { beforeEach, describe, expect, it } from "vitest";
import {
  BACKUP_FORMAT,
  BackupError,
  backupFileName,
  buildBackup,
  parseBackup,
  restoreBackup,
} from "./backup";
import {
  CHECKINS_KEY,
  GROUP_MEMBERS_KEY,
  clearCheckInCache,
  loadAllCheckIns,
  loadDebriefSettings,
  loadGroupMembers,
  saveDebriefSettings,
} from "./storage";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

const checkIn = {
  id: "c1",
  studentName: "Maria Lopez",
  grade: "10",
  classPeriod: "Period 3",
  reasons: ["Academic support / tutoring"] as const,
  reasonNotes: "",
  createdAt: "2026-07-25T18:00:00.000Z",
};

describe("buildBackup", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("captures check-ins, group data and settings", () => {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkIn]));
    localStorage.setItem(
      GROUP_MEMBERS_KEY,
      JSON.stringify([{ name: "Andre Bell", grade: "11" }]),
    );
    saveDebriefSettings({
      ...DEFAULT_DEBRIEF_SETTINGS,
      yourName: "Jordan Reeves",
    });
    clearCheckInCache();

    const backup = buildBackup();

    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.checkIns).toHaveLength(1);
    expect(backup.groupMembers).toEqual([{ name: "Andre Bell", grade: "11" }]);
    expect(backup.settings.yourName).toBe("Jordan Reeves");
  });

  it("names the file by date", () => {
    expect(backupFileName(new Date(2026, 6, 25))).toBe(
      "family-purpose-backup-2026-07-25.json",
    );
  });
});

describe("parseBackup", () => {
  it("rejects files that are not backups", () => {
    expect(() => parseBackup("{}")).toThrow(BackupError);
    expect(() => parseBackup("not json")).toThrow(BackupError);
    expect(() =>
      parseBackup(JSON.stringify({ format: "something-else" })),
    ).toThrow(/not a Family Purpose backup/);
  });

  it("rejects a backup with no check-in array", () => {
    expect(() =>
      parseBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1 })),
    ).toThrow(/missing its check-in data/);
  });

  it("fills in optional sections that are absent", () => {
    const backup = parseBackup(
      JSON.stringify({ format: BACKUP_FORMAT, checkIns: [checkIn] }),
    );
    expect(backup.groupMembers).toEqual([]);
    expect(backup.groupSessions).toEqual([]);
  });
});

describe("restoreBackup", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("round-trips exported data back onto a clean device", () => {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkIn]));
    localStorage.setItem(
      GROUP_MEMBERS_KEY,
      JSON.stringify([{ name: "Andre Bell", grade: "11" }]),
    );
    saveDebriefSettings({
      ...DEFAULT_DEBRIEF_SETTINGS,
      schoolName: "Riverside High",
    });
    clearCheckInCache();
    const exported = JSON.stringify(buildBackup());

    localStorage.clear();
    clearCheckInCache();
    expect(loadAllCheckIns()).toEqual([]);

    restoreBackup(parseBackup(exported));

    expect(loadAllCheckIns()).toHaveLength(1);
    expect(loadGroupMembers()).toEqual([{ name: "Andre Bell", grade: "11" }]);
    expect(loadDebriefSettings().schoolName).toBe("Riverside High");
  });
});
