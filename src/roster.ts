import type { CheckIn, CheckInReason } from "./types";
import { CHECK_IN_REASONS } from "./types";

export interface StudentProfile {
  name: string;
  grade: string;
  classPeriod: string;
  lastCheckInAt: string;
  count: number;
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * One entry per student, carrying the grade and period from their most recent
 * check-in so repeat visits can be filled in from the name alone.
 */
export function buildRoster(checkIns: CheckIn[]): StudentProfile[] {
  const byStudent = new Map<string, StudentProfile>();

  for (const c of checkIns) {
    const key = normalizeName(c.studentName);
    if (!key) continue;
    const existing = byStudent.get(key);
    if (!existing) {
      byStudent.set(key, {
        name: c.studentName.trim(),
        grade: c.grade,
        classPeriod: c.classPeriod,
        lastCheckInAt: c.createdAt,
        count: 1,
      });
      continue;
    }
    existing.count += 1;
    if (c.createdAt > existing.lastCheckInAt) {
      existing.name = c.studentName.trim();
      existing.grade = c.grade;
      existing.classPeriod = c.classPeriod;
      existing.lastCheckInAt = c.createdAt;
    }
  }

  return [...byStudent.values()].sort((a, b) =>
    b.lastCheckInAt.localeCompare(a.lastCheckInAt),
  );
}

export function findStudent(
  roster: StudentProfile[],
  name: string,
): StudentProfile | undefined {
  const key = normalizeName(name);
  if (!key) return undefined;
  return roster.find((s) => normalizeName(s.name) === key);
}

export function buildRecentPeriods(
  checkIns: CheckIn[],
  limit = 8,
): string[] {
  const seen = new Map<string, string>();
  for (const c of checkIns) {
    const period = c.classPeriod.trim();
    if (!period) continue;
    const key = period.toLowerCase();
    const previous = seen.get(key);
    if (!previous || c.createdAt > previous) seen.set(key, c.createdAt);
  }
  return [...seen.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, limit)
    .map(([key]) => {
      const match = checkIns.find(
        (c) => c.classPeriod.trim().toLowerCase() === key,
      );
      return match ? match.classPeriod.trim() : key;
    });
}

/** Reasons ordered by how often they've been used, so common ones sit first. */
export function orderReasonsByUse(checkIns: CheckIn[]): CheckInReason[] {
  const counts = new Map<CheckInReason, number>();
  for (const c of checkIns) {
    for (const r of c.reasons) {
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
  }
  return [...CHECK_IN_REASONS].sort((a, b) => {
    const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    if (diff !== 0) return diff;
    return CHECK_IN_REASONS.indexOf(a) - CHECK_IN_REASONS.indexOf(b);
  });
}
