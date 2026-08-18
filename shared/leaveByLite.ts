import type { SyncedUserSettings } from "./userDataTypes";
import { dayKey, isWeekend, zonedDateTime } from "./timezone";

export interface LeaveByLite {
  leaveBy: Date;
  arriveBy: Date;
  destination: string;
}

/** Server-side leave-by estimate (weekday school default; no Woodhouse/calendar). */
export function computeServerLeaveBy(
  settings: SyncedUserSettings,
  forDate = new Date(),
): LeaveByLite | null {
  const tz = settings.timezone;
  if (isWeekend(forDate, tz)) return null;

  const day = dayKey(tz, forDate);
  const arriveBy = zonedDateTime(day, settings.schoolStartTime || "08:00", tz);
  const commute = settings.commuteMinutes;
  const buffer = settings.arriveBufferMinutes;
  const leaveBy = new Date(arriveBy.getTime() - (commute + buffer) * 60_000);
  const destination = settings.schoolName || "school";

  return { leaveBy, arriveBy, destination };
}
