/**
 * Live commute, computed on the server (no phone prompts): a scheduled job
 * fetches drive time with traffic on school mornings and saves it to the
 * account; every device and the server's leave-by push read the same number.
 */
import type { SyncedUserSettings } from "./userDataTypes";
import { dayKey, isWeekend, localHour } from "./timezone";
import { NO_SCHOOL_DAYS } from "./schoolCalendar";

export interface LiveCommute {
  minutes: number;
  /** Google's text, e.g. "38 mins". */
  text?: string;
  fetchedAt: string;
}

/** Live minutes are trusted for 40 minutes, then we fall back to the manual number. */
export const LIVE_FRESH_MS = 40 * 60_000;

export function commuteMinutesFor(settings: Pick<SyncedUserSettings, "useLiveCommute" | "commuteMinutes">, live: LiveCommute | null | undefined, now = new Date()): number {
  if (settings.useLiveCommute && live && now.getTime() - Date.parse(live.fetchedAt) < LIVE_FRESH_MS && live.minutes > 0) return live.minutes;
  return settings.commuteMinutes;
}

/** Only fetch traffic when it matters: school days, in the 4 hours before school starts. */
export function inCommuteWindow(settings: Pick<SyncedUserSettings, "timezone" | "schoolStartTime">, now = new Date()): boolean {
  const tz = settings.timezone;
  if (isWeekend(now, tz) || NO_SCHOOL_DAYS.has(dayKey(tz, now))) return false;
  const [h, m] = (settings.schoolStartTime || "08:00").split(":").map(Number);
  const start = h + (m || 0) / 60;
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(fmt.find((p) => p.type === "hour")?.value ?? localHour(tz, now));
  const minute = Number(fmt.find((p) => p.type === "minute")?.value ?? 0);
  const t = hour + minute / 60;
  return t >= start - 4 && t <= start;
}
