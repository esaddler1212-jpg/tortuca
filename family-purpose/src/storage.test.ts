import { beforeEach, describe, expect, it } from "vitest";
import {
  CHECKINS_KEY,
  GROUP_MEMBERS_KEY,
  SETTINGS_KEY,
  clearCheckInCache,
  loadAllCheckIns,
  loadGroupMembers,
  migrateRenamedKeys,
} from "./storage";

describe("migrateRenamedKeys", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCheckInCache();
  });

  it("moves data saved under the old key names", () => {
    const checkIns = [
      {
        id: "c1",
        studentName: "Maria Lopez",
        grade: "10",
        classPeriod: "Period 3",
        reasons: [],
        reasonNotes: "kept",
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem("tortuca_checkins", JSON.stringify(checkIns));
    localStorage.setItem(
      "tortuca_group_members",
      JSON.stringify([{ name: "Andre Bell", grade: "11" }]),
    );

    migrateRenamedKeys();

    expect(loadAllCheckIns()).toHaveLength(1);
    expect(loadAllCheckIns()[0].reasonNotes).toBe("kept");
    expect(loadGroupMembers()).toEqual([{ name: "Andre Bell", grade: "11" }]);
    expect(localStorage.getItem("tortuca_checkins")).toBeNull();
  });

  it("never overwrites data already stored under the current keys", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ yourName: "Current" }));
    localStorage.setItem(
      "tortuca_debrief_settings",
      JSON.stringify({ yourName: "Old" }),
    );

    migrateRenamedKeys();

    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).yourName).toBe(
      "Current",
    );
  });

  it("does nothing when there is no old data", () => {
    migrateRenamedKeys();
    expect(localStorage.getItem(CHECKINS_KEY)).toBeNull();
    expect(localStorage.getItem(GROUP_MEMBERS_KEY)).toBeNull();
  });
});
