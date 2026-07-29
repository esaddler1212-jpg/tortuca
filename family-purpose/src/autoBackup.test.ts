import { beforeEach, describe, expect, it, vi } from "vitest";
import * as backup from "./backup";
import {
  clearBackupState,
  dataFingerprint,
  markBackedUp,
  needsBackup,
  runAutoBackup,
} from "./autoBackup";
import { CHECKINS_KEY, clearCheckInCache } from "./storage";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

const checkIn = {
  id: "c1",
  studentName: "Maria Lopez",
  grade: "7",
  classPeriod: "Period 3",
  reasons: ["Academic support / tutoring"] as const,
  reasonNotes: "",
  createdAt: "2026-09-15T10:00:00.000Z",
};

describe("backup fingerprint", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
    clearBackupState();
  });

  it("changes when check-ins change", () => {
    const before = dataFingerprint();
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkIn]));
    clearCheckInCache();
    expect(dataFingerprint()).not.toBe(before);
    expect(needsBackup()).toBe(true);
  });

  it("clears after a successful mark", () => {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkIn]));
    clearCheckInCache();
    const fp = dataFingerprint();
    markBackedUp(fp, "download");
    expect(needsBackup()).toBe(false);
  });
});

describe("runAutoBackup", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
    clearBackupState();
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkIn]));
    clearCheckInCache();
  });

  it("downloads when upload URL is not set", async () => {
    const download = vi.spyOn(backup, "downloadBackup").mockImplementation(() => {});

    const result = await runAutoBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: true,
    });

    expect(result.downloaded).toBe(true);
    expect(needsBackup()).toBe(false);
    expect(download).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("uploads when a URL is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runAutoBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: true,
      backupUploadUrl: "https://example.com/api/family-purpose-backup",
      backupUploadKey: "secret",
      deviceLabel: "Work Chromebook",
    });

    expect(result.uploaded).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/family-purpose-backup",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Backup-Key": "secret" }),
      }),
    );
    vi.unstubAllGlobals();
  });

  it("skips when auto-backup is off", async () => {
    const result = await runAutoBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: false,
    });
    expect(result.skipped).toBe(true);
  });
});
