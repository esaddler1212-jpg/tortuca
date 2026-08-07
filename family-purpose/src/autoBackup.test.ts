import { beforeEach, describe, expect, it, vi } from "vitest";
import * as backup from "./backup";
import {
  clearBackupState,
  dataFingerprint,
  markBackedUp,
  needsBackup,
  runCloudSync,
  runAutoBackup,
  runScheduledBackup,
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
      backupSaveToDownloads: true,
    });

    expect(result.downloaded).toBe(true);
    expect(needsBackup()).toBe(false);
    expect(download).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("uploads when a URL is configured", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runAutoBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: true,
      backupUploadUrl: "https://example.com/api/family-purpose-backup",
      backupUploadKey: "secret",
      deviceLabel: "Work Chromebook",
    });

    expect(result.uploaded).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://example.com/api/family-purpose-backup",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "X-Backup-Key": "secret" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://example.com/api/family-purpose-backup",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Backup-Key": "secret" }),
      }),
    );
    vi.unstubAllGlobals();
  });

  it("cloud sync pulls and uploads without download", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const download = vi.spyOn(backup, "downloadBackup").mockImplementation(() => {});

    const result = await runCloudSync({
      ...DEFAULT_DEBRIEF_SETTINGS,
      backupUploadUrl: "https://example.com/api/family-purpose-backup",
      backupUploadKey: "secret",
      deviceLabel: "My phone",
    });

    expect(result.uploaded).toBe(true);
    expect(download).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips when auto-backup is off", async () => {
    const result = await runAutoBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: false,
    });
    expect(result.skipped).toBe(true);
  });

  it("scheduled backup skips before 2:30 PM Pacific", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T21:00:00.000Z")); // 2 PM PDT
    const result = await runScheduledBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: true,
      backupSaveToDownloads: true,
    });
    expect(result.skipped).toBe(true);
    vi.useRealTimers();
  });

  it("scheduled backup downloads after 2:30 PM Pacific when enabled", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T21:30:00.000Z")); // 2:30 PM PDT
    const download = vi.spyOn(backup, "downloadBackup").mockImplementation(() => {});
    const result = await runScheduledBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: true,
      backupSaveToDownloads: true,
    });
    expect(result.downloaded).toBe(true);
    expect(download).toHaveBeenCalled();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("scheduled backup uploads without download on phone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T21:30:00.000Z"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const download = vi.spyOn(backup, "downloadBackup").mockImplementation(() => {});

    const result = await runScheduledBackup({
      ...DEFAULT_DEBRIEF_SETTINGS,
      autoBackupEnabled: true,
      backupSaveToDownloads: false,
      backupUploadUrl: "https://example.com/api/family-purpose-backup",
      backupUploadKey: "secret",
    });

    expect(result.uploaded).toBe(true);
    expect(download).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});
