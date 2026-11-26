import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { buildBackup, type Backup } from "./backup";
import { isBackupPayload, mergeBackups } from "./backupMerge";

function backupHeaders(settings: DebriefSettings): Record<string, string> {
  const key = settings.backupUploadKey.trim();
  return key ? { "X-Backup-Key": key } : {};
}

/** Label stored on each check-in (Settings → device name). */
export function currentDeviceLabel(settings: DebriefSettings): string {
  const label = settings.deviceLabel.trim();
  return label || "This device";
}

/**
 * Merges this device's data with all uploads in the cloud for reports only —
 * does not change what is stored on this device.
 */
export async function fetchMergedReportData(
  settings: DebriefSettings,
): Promise<{
  checkIns: CheckIn[];
  sessions: GroupSession[];
  cloudIncluded: boolean;
  error?: string;
}> {
  const local = buildBackup();

  const uploadUrl = settings.backupUploadUrl.trim();
  if (!uploadUrl || !navigator.onLine) {
    return {
      checkIns: local.checkIns,
      sessions: local.groupSessions,
      cloudIncluded: false,
    };
  }

  try {
    const response = await fetch(uploadUrl, {
      method: "GET",
      headers: backupHeaders(settings),
    });
    if (response.status === 404) {
      return {
        checkIns: local.checkIns,
        sessions: local.groupSessions,
        cloudIncluded: false,
      };
    }
    if (!response.ok) {
      return {
        checkIns: local.checkIns,
        sessions: local.groupSessions,
        cloudIncluded: false,
        error: `Could not load other devices (${response.status}). Showing this device only.`,
      };
    }

    const remote: unknown = await response.json();
    if (!isBackupPayload(remote)) {
      return {
        checkIns: local.checkIns,
        sessions: local.groupSessions,
        cloudIncluded: false,
        error: "Cloud data was not valid. Showing this device only.",
      };
    }

    const merged = mergeBackups(local, remote as Backup);
    return {
      checkIns: merged.checkIns,
      sessions: merged.groupSessions,
      cloudIncluded: true,
    };
  } catch {
    return {
      checkIns: local.checkIns,
      sessions: local.groupSessions,
      cloudIncluded: false,
      error: "Could not reach the cloud. Showing this device only.",
    };
  }
}
