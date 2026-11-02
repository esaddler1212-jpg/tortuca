import { getStore } from "@netlify/blobs";

/**
 * Family Purpose backups synced to IRIS. Each device uploads its full backup;
 * IRIS keeps the latest copy per device and merges them (same rules as the
 * Family Purpose app's own sync), including the private student notes.
 */
export const BACKUP_FORMAT = "family-purpose-checkins";

export interface RawBackup {
  format: string;
  version: number;
  exportedAt: string;
  settings: Record<string, unknown>;
  checkIns: { id: string; createdAt: string; [k: string]: unknown }[];
  groupMembers: { name: string; grade: string; [k: string]: unknown }[];
  groupSessions: { id: string; updatedAt: string; [k: string]: unknown }[];
  /** Private student memory (notes). Never sent to IRIS's screen or AI. */
  studentNotes?: { id: string; updatedAt: string; [k: string]: unknown }[];
}

export function isBackup(value: unknown): value is RawBackup {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<RawBackup>;
  return v.format === BACKUP_FORMAT && Array.isArray(v.checkIns);
}

const norm = (s: string) => s.trim().toLowerCase();

/** Newest version of each item wins; notes merge by id (deletions kept as tombstones). */
export function mergeBackups(base: RawBackup, incoming: RawBackup): RawBackup {
  const byId = <T extends { id: string }>(a: T[], b: T[], newer: (x: T, y: T) => boolean) => {
    const m = new Map(a.map((x) => [x.id, x]));
    for (const x of b) {
      const cur = m.get(x.id);
      if (!cur || newer(x, cur)) m.set(x.id, x);
    }
    return [...m.values()];
  };
  const members = new Map((base.groupMembers ?? []).map((m) => [norm(m.name), m]));
  for (const m of incoming.groupMembers ?? []) members.set(norm(m.name), m);
  return {
    format: BACKUP_FORMAT,
    version: Math.max(base.version ?? 1, incoming.version ?? 1),
    exportedAt: new Date().toISOString(),
    settings: incoming.exportedAt > base.exportedAt ? incoming.settings : base.settings,
    checkIns: byId(base.checkIns, incoming.checkIns, (x, y) => x.createdAt > y.createdAt).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
    groupSessions: byId(base.groupSessions ?? [], incoming.groupSessions ?? [], (x, y) => x.updatedAt > y.updatedAt),
    groupMembers: [...members.values()],
    studentNotes: byId(base.studentNotes ?? [], incoming.studentNotes ?? [], (x, y) => x.updatedAt > y.updatedAt),
  };
}

export function backupStore() {
  return getStore({ name: "family-purpose-backups", consistency: "strong" });
}

/** All devices' latest backups merged, or null if none. */
export async function loadMergedBackup(): Promise<RawBackup | null> {
  const store = backupStore();
  const { blobs } = await store.list({ prefix: "latest/" });
  let merged: RawBackup | null = null;
  for (const blob of blobs) {
    const raw: unknown = await store.get(blob.key, { type: "json" });
    if (!isBackup(raw)) continue;
    merged = merged ? mergeBackups(merged, raw) : raw;
  }
  return merged;
}
