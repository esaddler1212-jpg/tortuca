export const PACIFIC_TZ = "America/Los_Angeles";
export const DAILY_BACKUP_HOUR = 14;
export const DAILY_BACKUP_MINUTE = 30;

/** Pacific calendar date as YYYY-MM-DD. */
export function pacificDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: PACIFIC_TZ });
}

function pacificHourMinute(date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

/** True when local Pacific time is at or after 2:30 PM. */
export function isPastDailyBackupTime(date: Date): boolean {
  const { hour, minute } = pacificHourMinute(date);
  return hour > DAILY_BACKUP_HOUR || (hour === DAILY_BACKUP_HOUR && minute >= DAILY_BACKUP_MINUTE);
}

/** Ms until the next 2:30 PM Pacific (or 0 if that time has already passed today). */
export function msUntilNextBackupWindow(now = new Date()): number {
  if (isPastDailyBackupTime(now)) return 0;
  const { hour, minute } = pacificHourMinute(now);
  const minutesUntil =
    (DAILY_BACKUP_HOUR - hour) * 60 + (DAILY_BACKUP_MINUTE - minute);
  return Math.max(0, minutesUntil * 60 * 1000);
}
