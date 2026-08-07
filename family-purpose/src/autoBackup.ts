import {
  buildBackup,
  downloadBackup,
  type Backup,
} from "./backup";
import {
  countNewCheckIns,
  isBackupPayload,
  mergeBackups,
} from "./backupMerge";
import {
  isPastDailyBackupTime,
  pacificDateKey,
} from "./backupSchedule";
import type { DebriefSettings } from "./types";
import {
  clearCheckInCache,
  saveAllCheckIns,
  saveGroupMembers,
  saveGroupSessions,
} from "./storage";

const STATE_KEY = "familypurpose_backup_state";

interface BackupState {
  fingerprint: string;
  backedUpAt: string;
  method: "download" | "upload";
  /** Pacific YYYY-MM-DD when the daily 2:30 PM backup last ran. */
  lastScheduledPacificDay?: string;
}

export function dataFingerprint(): string {
  const backup = buildBackup();
  const lastCheckIn = backup.checkIns.reduce(
    (max, c) => (c.createdAt > max ? c.createdAt : max),
    "",
  );
  const lastSession = backup.groupSessions.reduce(
    (max, s) => (s.updatedAt > max ? s.updatedAt : max),
    "",
  );
  return [
    backup.checkIns.length,
    lastCheckIn,
    backup.groupSessions.length,
    lastSession,
    backup.groupMembers.length,
    backup.settings.schoolName,
    backup.settings.yourName,
  ].join("|");
}

export function loadBackupState(): BackupState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BackupState;
  } catch {
    return null;
  }
}

export function markBackedUp(
  fingerprint: string,
  method: BackupState["method"],
  opts?: { scheduledPacificDay?: string },
): void {
  const prev = loadBackupState();
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      fingerprint,
      backedUpAt: new Date().toISOString(),
      method,
      lastScheduledPacificDay:
        opts?.scheduledPacificDay ?? prev?.lastScheduledPacificDay,
    }),
  );
}

export function needsBackup(): boolean {
  const fingerprint = dataFingerprint();
  const state = loadBackupState();
  return state?.fingerprint !== fingerprint;
}

/** Daily 2:30 PM Pacific backup when there is new data and we have not run today. */
export function needsScheduledBackupRun(now = new Date()): boolean {
  if (!isPastDailyBackupTime(now)) return false;
  if (!needsBackup()) return false;
  const day = pacificDateKey(now);
  const state = loadBackupState();
  if (state?.lastScheduledPacificDay === day) return false;
  return true;
}

export interface AutoBackupResult {
  skipped?: boolean;
  downloaded?: boolean;
  uploaded?: boolean;
  merged?: number;
  error?: string;
}

export interface PullMergeResult {
  merged?: boolean;
  addedCheckIns?: number;
  error?: string;
}

function backupHeaders(settings: DebriefSettings): Record<string, string> {
  const key = settings.backupUploadKey.trim();
  return key ? { "X-Backup-Key": key } : {};
}

/** Pull merged cloud data and combine with this device (phone ↔ computer sync). */
export async function pullAndMergeFromCloud(
  settings: DebriefSettings,
): Promise<PullMergeResult> {
  const uploadUrl = settings.backupUploadUrl.trim();
  if (!uploadUrl) {
    return { error: "Add a backup upload URL in Settings to sync across devices." };
  }

  try {
    const response = await fetch(uploadUrl, {
      method: "GET",
      headers: backupHeaders(settings),
    });
    if (response.status === 404) {
      return { merged: false, addedCheckIns: 0 };
    }
    if (!response.ok) {
      return {
        error: `Could not download sync data (${response.status}). Check your URL and key.`,
      };
    }

    const remote: unknown = await response.json();
    if (!isBackupPayload(remote)) {
      return { error: "The server returned data that is not a valid backup." };
    }

    const local = buildBackup();
    const added = countNewCheckIns(local, remote);
    if (added === 0 && remote.checkIns.length <= local.checkIns.length) {
      return { merged: false, addedCheckIns: 0 };
    }

    const merged = mergeBackups(local, remote);
    saveAllCheckIns(merged.checkIns);
    saveGroupMembers(merged.groupMembers);
    saveGroupSessions(merged.groupSessions);
    clearCheckInCache();
    return { merged: true, addedCheckIns: added };
  } catch {
    return {
      error: "Could not reach the backup server. Check your internet connection.",
    };
  }
}

async function runBackupCore(
  settings: DebriefSettings,
  options: { allowDownload: boolean; scheduledPacificDay?: string },
): Promise<AutoBackupResult> {
  const uploadUrl = settings.backupUploadUrl.trim();
  let mergedCount = 0;

  if (uploadUrl) {
    const pull = await pullAndMergeFromCloud(settings);
    if (pull.error && pull.error.includes("Could not")) {
      return { error: pull.error };
    }
    if (pull.merged && pull.addedCheckIns) {
      mergedCount = pull.addedCheckIns;
    }
  }

  if (!needsBackup() && mergedCount === 0) {
    return { skipped: true, merged: undefined };
  }

  const fingerprint = dataFingerprint();
  const backup = buildBackup();
  const markOpts = options.scheduledPacificDay
    ? { scheduledPacificDay: options.scheduledPacificDay }
    : undefined;

  if (uploadUrl) {
    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...backupHeaders(settings),
        },
        body: JSON.stringify({
          deviceLabel: settings.deviceLabel.trim() || "device",
          exportedAt: backup.exportedAt,
          backup,
        }),
      });
      if (!response.ok) {
        return {
          error: `Upload failed (${response.status}). Will try again later.`,
          merged: mergedCount > 0 ? mergedCount : undefined,
        };
      }
      markBackedUp(fingerprint, "upload", markOpts);
      return {
        uploaded: true,
        merged: mergedCount > 0 ? mergedCount : undefined,
      };
    } catch {
      return {
        error: "Could not reach the backup server. Will try again later.",
        merged: mergedCount > 0 ? mergedCount : undefined,
      };
    }
  }

  if (!options.allowDownload) {
    return {
      skipped: true,
      merged: mergedCount > 0 ? mergedCount : undefined,
    };
  }

  try {
    downloadBackup();
    markBackedUp(fingerprint, "download", markOpts);
    return {
      downloaded: true,
      merged: mergedCount > 0 ? mergedCount : undefined,
    };
  } catch {
    return { error: "Could not save the backup file." };
  }
}

/** Pull from cloud, merge, and upload local changes — no Downloads file. */
export async function runCloudSync(
  settings: DebriefSettings,
): Promise<AutoBackupResult> {
  if (!settings.backupUploadUrl.trim()) {
    return { skipped: true };
  }
  return runBackupCore(settings, { allowDownload: false });
}

/** Once-daily backup at 2:30 PM Pacific when online and there is new data. */
export async function runScheduledBackup(
  settings: DebriefSettings,
): Promise<AutoBackupResult> {
  if (!settings.autoBackupEnabled) return { skipped: true };
  const now = new Date();
  if (!needsScheduledBackupRun(now)) return { skipped: true };

  return runBackupCore(settings, {
    allowDownload: settings.backupSaveToDownloads,
    scheduledPacificDay: pacificDateKey(now),
  });
}

/** Manual or test backup — not tied to the daily schedule. */
export async function runAutoBackup(
  settings: DebriefSettings,
): Promise<AutoBackupResult> {
  if (!settings.autoBackupEnabled) return { skipped: true };
  if (!needsBackup()) return { skipped: true };

  return runBackupCore(settings, {
    allowDownload:
      settings.backupSaveToDownloads || !settings.backupUploadUrl.trim(),
  });
}

export function formatLastBackupLabel(state: BackupState | null): string | null {
  if (!state) return null;
  const when = new Date(state.backedUpAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return state.method === "upload"
    ? `Last upload: ${when}`
    : `Last backup file: ${when}`;
}

export function formatNextBackupHint(): string {
  if (needsScheduledBackupRun()) {
    return "Daily backup is due now (2:30 PM Pacific) — will run when you are online.";
  }
  if (isPastDailyBackupTime(new Date())) {
    return "Today's 2:30 PM Pacific backup is done (or there was nothing new to save).";
  }
  return "Next automatic backup: 2:30 PM Pacific today.";
}

/** For tests — reset backup tracking. */
export function clearBackupState(): void {
  localStorage.removeItem(STATE_KEY);
}

export function backupPayloadForUpload(
  settings: DebriefSettings,
): { deviceLabel: string; exportedAt: string; backup: Backup } {
  const backup = buildBackup();
  return {
    deviceLabel: settings.deviceLabel.trim() || "Chromebook",
    exportedAt: backup.exportedAt,
    backup,
  };
}
