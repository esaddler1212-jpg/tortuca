import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMergedReportData } from "./reportData";
import { CHECKINS_KEY, clearCheckInCache } from "./storage";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

const phoneCheckIn = {
  id: "phone-1",
  studentName: "Andre Bell",
  grade: "7",
  classPeriod: "Period 2",
  reasons: ["Academic support / tutoring"],
  reasonNotes: "",
  loggedOnDevice: "My phone",
  createdAt: "2026-09-15T14:00:00.000Z",
};

const laptopCheckIn = {
  id: "laptop-1",
  studentName: "Maria Lopez",
  grade: "8",
  classPeriod: "Period 4",
  reasons: ["Social / emotional support"],
  reasonNotes: "",
  loggedOnDevice: "Work laptop",
  createdAt: "2026-09-15T15:00:00.000Z",
};

describe("fetchMergedReportData", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("returns local data when cloud is not configured", async () => {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([laptopCheckIn]));
    clearCheckInCache();

    const result = await fetchMergedReportData(DEFAULT_DEBRIEF_SETTINGS);
    expect(result.cloudIncluded).toBe(false);
    expect(result.checkIns).toHaveLength(1);
    expect(result.checkIns[0].studentName).toBe("Maria Lopez");
  });

  it("merges remote check-ins without writing to localStorage", async () => {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([laptopCheckIn]));
    clearCheckInCache();

    const remoteBackup = {
      format: "family-purpose-checkins",
      version: 1,
      exportedAt: "2026-09-15T16:00:00.000Z",
      checkIns: [phoneCheckIn],
      groupSessions: [],
      groupMembers: [],
      settings: DEFAULT_DEBRIEF_SETTINGS,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => remoteBackup,
      }),
    );

    const result = await fetchMergedReportData({
      ...DEFAULT_DEBRIEF_SETTINGS,
      backupUploadUrl: "https://example.com/api/family-purpose-backup",
    });

    expect(result.cloudIncluded).toBe(true);
    expect(result.checkIns).toHaveLength(2);
    expect(localStorage.getItem(CHECKINS_KEY)).toContain("laptop-1");
    expect(localStorage.getItem(CHECKINS_KEY)).not.toContain("phone-1");
    vi.unstubAllGlobals();
  });
});
