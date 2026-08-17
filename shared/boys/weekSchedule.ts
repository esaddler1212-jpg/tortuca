/** Week 1 starts Monday, August 24, 2026 (Pacific). */
export const CURRICULUM_START_DAY = "2026-08-24";
export const CURRICULUM_TIMEZONE = "America/Los_Angeles";
export const CURRICULUM_WEEKS = 12;

function dayKeyInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

/** 0 = before curriculum starts; 1–12 = active weeks; >12 = curriculum complete. */
export function getCurrentWeekNumber(now = new Date()): number {
  const today = dayKeyInTz(now, CURRICULUM_TIMEZONE);
  if (today < CURRICULUM_START_DAY) return 0;

  const start = new Date(`${CURRICULUM_START_DAY}T12:00:00`);
  const current = new Date(`${today}T12:00:00`);
  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.floor(diffDays / 7) + 1;
  if (week > CURRICULUM_WEEKS) return CURRICULUM_WEEKS + 1;
  return week;
}

export function weekStatusLabel(weekNumber: number): string {
  if (weekNumber === 0) return "Starts next week";
  if (weekNumber > CURRICULUM_WEEKS) return "Curriculum complete";
  return `Week ${weekNumber}`;
}
