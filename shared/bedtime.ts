import type { SyncedUserSettings } from "./userDataTypes";
import { addDays, dayKey, isWeekendDay, zonedDateTime } from "./timezone";
import { NO_SCHOOL_DAYS } from "./schoolCalendar";

export interface LeaveByForBedtime {
  leaveBy: Date;
  destination: string;
}

export interface BedtimePlan {
  lightsOut: Date;
  windDownStart: Date;
  wakeUp: Date;
  /** Local calendar day (YYYY-MM-DD) of the wake-up this plan is for. */
  wakeDay: string;
  sleepHours: number;
  reason: string;
  earlyWake: boolean;
}

/** Weekends and school holidays: no work, so the relaxed wake time applies. */
export function isDayOff(day: string): boolean {
  return isWeekendDay(day) || NO_SCHOOL_DAYS.has(day);
}

/** Regular alarm for a calendar day: day-off wake on weekends/holidays, weekday alarm otherwise. */
export function alarmFor(settings: SyncedUserSettings, day: string): string {
  return isDayOff(day) ? settings.weekendWakeTime : settings.wakeTime;
}

/**
 * The calendar day of the next wake-up that hasn't happened yet: today if it's
 * still before today's alarm (e.g. 12:30 AM), otherwise tomorrow.
 */
export function nextWakeDay(settings: SyncedUserSettings, now = new Date()): string {
  const tz = settings.timezone;
  const today = dayKey(tz, now);
  const todaysAlarm = zonedDateTime(today, alarmFor(settings, today), tz);
  return now < todaysAlarm ? today : addDays(today, 1);
}

/**
 * Sleep plan for the next wake-up. `leaveByOnWakeDay` is the leave-by for that
 * morning (ignored if it's for a different day); it pulls the wake earlier
 * when the regular alarm wouldn't leave enough time to get ready.
 */
export function computeSuggestedBedtime(
  settings: SyncedUserSettings,
  leaveByOnWakeDay: LeaveByForBedtime | null,
  now = new Date(),
): BedtimePlan {
  const tz = settings.timezone;
  const wakeDay = nextWakeDay(settings, now);
  const leave =
    leaveByOnWakeDay && dayKey(tz, leaveByOnWakeDay.leaveBy) === wakeDay ? leaveByOnWakeDay : null;
  const weekend = isDayOff(wakeDay);
  const holiday = weekend && !isWeekendDay(wakeDay);

  // A day-off morning with somewhere to be uses the weekday alarm.
  const wakeHHMM = weekend && !leave ? settings.weekendWakeTime : settings.wakeTime;
  const alarmWake = zonedDateTime(wakeDay, wakeHHMM, tz);

  let effectiveWake = alarmWake;
  let earlyWake = false;
  if (leave) {
    const needWake = new Date(leave.leaveBy.getTime() - settings.morningRoutineMinutes * 60_000);
    if (needWake < alarmWake) {
      effectiveWake = needWake;
      earlyWake = true;
    }
  }

  const lightsOut = new Date(effectiveWake.getTime() - settings.targetSleepHours * 3_600_000);
  const windDownStart = new Date(lightsOut.getTime() - settings.windDownMinutes * 60_000);

  const isTomorrow = wakeDay !== dayKey(tz, now);
  const when = isTomorrow ? "tomorrow" : "this morning";
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(d);

  let reason: string;
  if (leave) {
    reason = earlyWake
      ? `Early ${when}: leave by ${fmt(leave.leaveBy)} for ${leave.destination} · ${settings.targetSleepHours}h sleep`
      : `Leave by ${fmt(leave.leaveBy)} ${when} · wake ${fmt(effectiveWake)} · ${settings.targetSleepHours}h sleep`;
  } else if (weekend) {
    reason = `${holiday ? "No school" : "Weekend"}: wake ${fmt(effectiveWake)} · ${settings.targetSleepHours}h sleep`;
  } else {
    reason = `Weekday alarm ${fmt(effectiveWake)} · ${settings.targetSleepHours}h sleep`;
  }

  return {
    lightsOut,
    windDownStart,
    wakeUp: effectiveWake,
    wakeDay,
    sleepHours: settings.targetSleepHours,
    reason,
    earlyWake,
  };
}
