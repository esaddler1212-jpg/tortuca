import type { CheckIn, StudentNote } from "./types";
import { loadStudentNotes, saveStudentNotes } from "./storage";
import { normalizeName } from "./roster";

/**
 * A student's memory: your private notes plus patterns the app spots from
 * their check-ins. Computed on this device; nothing here is sent anywhere
 * except your own backup.
 */
export interface StudentMemory {
  notes: StudentNote[];
  patterns: string[];
}

const DAY = 86_400_000;

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Attendance / tardiness" → "attendance". */
function reasonLabel(reason: string): string {
  return reason.split(" / ")[0].toLowerCase();
}

export function studentMemory(name: string, checkIns: CheckIn[], notes: StudentNote[], now = new Date()): StudentMemory {
  const key = normalizeName(name);
  const mine = checkIns
    .filter((c) => normalizeName(c.studentName) === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const patterns: string[] = [];

  if (mine.length) {
    const t = now.getTime();
    const week = mine.filter((c) => t - Date.parse(c.createdAt) <= 7 * DAY).length;
    if (week >= 2) patterns.push(`${week} check-ins in the last 7 days`);
    else patterns.push(`${mine.length} check-in${mine.length === 1 ? "" : "s"} so far`);

    const month = mine.filter((c) => t - Date.parse(c.createdAt) <= 30 * DAY);
    const counts = new Map<string, number>();
    for (const c of month) for (const r of c.reasons) counts.set(r, (counts.get(r) ?? 0) + 1);
    const recurring = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 2);
    for (const [r, n] of recurring) patterns.push(`${reasonLabel(r)} came up ${n} times this month`);

    const last = mine[0];
    const bits = [last.reasons.map(reasonLabel).join(", "), last.outcome?.toLowerCase()].filter(Boolean);
    patterns.push(`Last check-in ${shortDate(last.createdAt)}${bits.length ? `: ${bits.join(" · ")}` : ""}`);

    const open = mine.find((c) => c.followUp && !c.followUp.completedAt);
    if (open?.followUp) {
      const overdue = Date.parse(open.followUp.dueAt) < t;
      patterns.push(`Follow-up ${overdue ? "overdue since" : "due"} ${shortDate(open.followUp.dueAt)}`);
    }

    const positive = mine.slice(0, 3).filter((c) => c.reasons.some((r) => r.startsWith("Celebration") || r.startsWith("Goal check-in"))).length;
    if (positive >= 2) patterns.push("Recent visits have been positive: keep the momentum");
  }

  return {
    notes: notes.filter((n) => n.studentKey === key && !n.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    patterns,
  };
}

export function addStudentNote(studentName: string, text: string): StudentNote | null {
  const clean = text.trim();
  if (!clean || !studentName.trim()) return null;
  const now = new Date().toISOString();
  const note: StudentNote = {
    id: crypto.randomUUID(),
    studentKey: normalizeName(studentName),
    studentName: studentName.trim(),
    text: clean.slice(0, 500),
    createdAt: now,
    updatedAt: now,
  };
  saveStudentNotes([...loadStudentNotes(), note]);
  return note;
}

/** Soft-delete so the deletion also syncs to your other devices. */
export function deleteStudentNote(id: string): void {
  const now = new Date().toISOString();
  saveStudentNotes(loadStudentNotes().map((n) => (n.id === id ? { ...n, text: "", deletedAt: now, updatedAt: now } : n)));
}
