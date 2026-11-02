import { describe, expect, it } from "vitest";
import { buildSetupStatus } from "./setupStatus";
import type { DebriefSettings } from "./types";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

describe("buildSetupStatus", () => {
  it("flags missing cloud sync when only URL is set", () => {
    const settings: DebriefSettings = {
      ...DEFAULT_DEBRIEF_SETTINGS,
      backupUploadUrl: "https://example.com/api/family-purpose-backup",
      backupUploadKey: "",
    };
    const cloud = buildSetupStatus(settings).find((i) => i.id === "cloud");
    expect(cloud?.level).toBe("warn");
  });

  it("marks BOYS code ok when set", () => {
    const settings: DebriefSettings = {
      ...DEFAULT_DEBRIEF_SETTINGS,
      boysClassCode: "PURPOSE-A",
    };
    const boys = buildSetupStatus(settings).find((i) => i.id === "boys-code");
    expect(boys?.level).toBe("ok");
  });
});
