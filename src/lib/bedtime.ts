import type { UserSettings } from "../types";
import type { LeaveByPlan } from "./leaveBy";
import { dayKey, zonedDateTime } from "./leaveBy";

export interface BedtimePlan {
  lightsOut: Date;
  windDownStart: Date;
  wakeUp: Date;
  sleepHours: number;
  reason: string;
  /** Tomorrow needs a wake before your usual alarm */
  earlyWake: boolean;
  tomorrowLeaveBy: LeaveByPlan | null;
}

function tomorrowDate(now: Date): Date {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return t;
}

function isWeekend(date: Date, timeZone: string): boolean {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return wd === "Sat" || wd === "Sun";
}

export function computeSuggestedBedtime(
  settings: UserSettings,
  tomorrowLeaveBy: LeaveByPlan | null,
  now = new Date(),
): BedtimePlan | null {
  const tz = settings.timezone;
  const tomorrow = tomorrowDate(now);
  const tomorrowDay = dayKey(tz, tomorrow);
  const weekend = isWeekend(tomorrow, tz);

  const wakeHHMM =
    weekend && !tomorrowLeaveBy ? settings.weekendWakeTime : settings.wakeTime;
  const alarmWake = zonedDateTime(tomorrowDay, wakeHHMM, tz);

  let effectiveWake = alarmWake;
  let earlyWake = false;

  if (tomorrowLeaveBy) {
    const needWake = new Date(
      tomorrowLeaveBy.leaveBy.getTime() - settings.morningRoutineMinutes * 60_000,
    );
    if (needWake.getTime() < alarmWake.getTime()) {
      effectiveWake = needWake;
      earlyWake = true;
    }
  }

  const sleepMs = settings.targetSleepHours * 60 * 60_000;
  const lightsOut = new Date(effectiveWake.getTime() - sleepMs);
  const windDownStart = new Date(lightsOut.getTime() - settings.windDownMinutes * 60_000);

  // Bedtime suggestion is for tonight — if lights-out is already past, still show with note
  let reason: string;
  if (tomorrowLeaveBy) {
    const dest = tomorrowLeaveBy.destination;
    const leave = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
    }).format(tomorrowLeaveBy.leaveBy);
    reason = earlyWake
      ? `Early tomorrow — leave by ${leave} for ${dest}; ${settings.targetSleepHours}h sleep`
      : `Leave by ${leave} tomorrow · wake ${wakeHHMM} · ${settings.targetSleepHours}h sleep`;
  } else if (weekend) {
    reason = `Open morning — wake ${wakeHHMM} · ${settings.targetSleepHours}h sleep`;
  } else {
    reason = `Weekday alarm ${wakeHHMM} · ${settings.targetSleepHours}h sleep`;
  }

  return {
    lightsOut,
    windDownStart,
    wakeUp: effectiveWake,
    sleepHours: settings.targetSleepHours,
    reason,
    earlyWake,
    tomorrowLeaveBy,
  };
}

export function isWindDownTime(plan: BedtimePlan, now = new Date()): boolean {
  return now >= plan.windDownStart;
}

export function isPastLightsOut(plan: BedtimePlan, now = new Date()): boolean {
  return now >= plan.lightsOut;
}
