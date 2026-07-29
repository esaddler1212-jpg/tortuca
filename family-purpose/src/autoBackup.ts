import {
  buildBackup,
  downloadBackup,
  type Backup,
} from "./backup";
import type { DebriefSettings } from "./types";

const STATE_KEY = "familypurpose_backup_state";

interface BackupState {
  fingerprint: string;
  backedUpAt: string;
  method: "download" | "upload";
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
): void {
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      fingerprint,
      backedUpAt: new Date().toISOString(),
      method,
    }),
  );
}

export function needsBackup(): boolean {
  const fingerprint = dataFingerprint();
  const state = loadBackupState();
  return state?.fingerprint !== fingerprint;
}

export interface AutoBackupResult {
  skipped?: boolean;
  downloaded?: boolean;
  uploaded?: boolean;
  error?: string;
}

export async function runAutoBackup(
  settings: DebriefSettings,
): Promise<AutoBackupResult> {
  if (!settings.autoBackupEnabled) return { skipped: true };
  if (!needsBackup()) return { skipped: true };

  const fingerprint = dataFingerprint();
  const backup = buildBackup();
  const uploadUrl = settings.backupUploadUrl.trim();

  if (uploadUrl) {
    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(settings.backupUploadKey.trim()
            ? { "X-Backup-Key": settings.backupUploadKey.trim() }
            : {}),
        },
        body: JSON.stringify({
          deviceLabel: settings.deviceLabel.trim() || "Chromebook",
          exportedAt: backup.exportedAt,
          backup,
        }),
      });
      if (!response.ok) {
        return {
          error: `Upload failed (${response.status}). Will try again when you are online.`,
        };
      }
      markBackedUp(fingerprint, "upload");
      return { uploaded: true };
    } catch {
      return {
        error: "Could not reach the backup server. Will try again when you are online.",
      };
    }
  }

  try {
    downloadBackup();
    markBackedUp(fingerprint, "download");
    return { downloaded: true };
  } catch {
    return { error: "Could not save the backup file." };
  }
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
