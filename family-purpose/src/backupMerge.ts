import type {
  CheckIn,
  DebriefSettings,
  GroupMember,
  GroupSession,
} from "./types";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type Backup,
} from "./backup";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Combines two backups without losing entries from either device.
 * Settings stay from `base` (this device); data arrays are unioned.
 */
export function mergeBackups(base: Backup, incoming: Backup): Backup {
  const checkInMap = new Map<string, CheckIn>(
    base.checkIns.map((c) => [c.id, c]),
  );
  for (const c of incoming.checkIns) {
    const existing = checkInMap.get(c.id);
    if (!existing || c.createdAt > existing.createdAt) {
      checkInMap.set(c.id, c);
    }
  }

  const sessionMap = new Map<string, GroupSession>(
    base.groupSessions.map((s) => [s.id, s]),
  );
  for (const s of incoming.groupSessions) {
    const existing = sessionMap.get(s.id);
    if (!existing || s.updatedAt > existing.updatedAt) {
      sessionMap.set(s.id, s);
    }
  }

  const memberMap = new Map<string, GroupMember>(
    base.groupMembers.map((m) => [normalizeName(m.name), m]),
  );
  for (const m of incoming.groupMembers) {
    memberMap.set(normalizeName(m.name), m);
  }

  const checkIns = [...checkInMap.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: base.settings,
    checkIns,
    groupSessions: [...sessionMap.values()],
    groupMembers: [...memberMap.values()],
  };
}

/** Count new check-ins that would arrive from merging `incoming` into `base`. */
export function countNewCheckIns(base: Backup, incoming: Backup): number {
  const ids = new Set(base.checkIns.map((c) => c.id));
  return incoming.checkIns.filter((c) => !ids.has(c.id)).length;
}

/** Minimal backup shape stored in Netlify Blobs (and returned from GET sync). */
export function isBackupPayload(value: unknown): value is Backup {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Backup>;
  return v.format === BACKUP_FORMAT && Array.isArray(v.checkIns);
}

export function emptyBackup(settings: DebriefSettings): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    checkIns: [],
    groupMembers: [],
    groupSessions: [],
  };
}
