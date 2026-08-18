import type {
  CheckIn,
  DebriefSettings,
  GroupMember,
  GroupSession,
} from "./types";
import {
  loadAllCheckIns,
  loadDebriefSettings,
  loadGroupMembers,
  loadGroupSessions,
  saveAllCheckIns,
  saveDebriefSettings,
  saveGroupMembers,
  saveGroupSessions,
} from "./storage";

export const BACKUP_FORMAT = "family-purpose-checkins";
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  settings: DebriefSettings;
  checkIns: CheckIn[];
  groupMembers: GroupMember[];
  groupSessions: GroupSession[];
}

export function buildBackup(): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: loadDebriefSettings(),
    checkIns: loadAllCheckIns(),
    groupMembers: loadGroupMembers(),
    groupSessions: loadGroupSessions(),
  };
}

export function backupFileName(date = new Date()): string {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `family-purpose-backup-${day}.json`;
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName();
  link.click();
  URL.revokeObjectURL(url);
}

export class BackupError extends Error {}

export function parseBackup(text: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError("That file is not valid JSON.");
  }

  const backup = parsed as Partial<Backup>;
  if (backup?.format !== BACKUP_FORMAT) {
    throw new BackupError("That file is not a Family Purpose backup.");
  }
  if (!Array.isArray(backup.checkIns)) {
    throw new BackupError("The backup is missing its check-in data.");
  }
  return {
    format: BACKUP_FORMAT,
    version: backup.version ?? BACKUP_VERSION,
    exportedAt: backup.exportedAt ?? new Date().toISOString(),
    settings: backup.settings ?? loadDebriefSettings(),
    checkIns: backup.checkIns,
    groupMembers: Array.isArray(backup.groupMembers) ? backup.groupMembers : [],
    groupSessions: Array.isArray(backup.groupSessions)
      ? backup.groupSessions
      : [],
  };
}

/** Replaces everything on this device with the contents of the backup. */
export function restoreBackup(backup: Backup): void {
  saveAllCheckIns(backup.checkIns);
  saveGroupMembers(backup.groupMembers);
  saveGroupSessions(backup.groupSessions);
  saveDebriefSettings(backup.settings);
}
