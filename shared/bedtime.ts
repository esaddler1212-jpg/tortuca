import type { SyncedUserSettings } from "./userDataTypes";
import { dayKey, isWeekend, zonedDateTime } from "./timezone";

export interface LeaveByForBedtime {
  leaveBy: Date;
  destination: string;
}

export interface BedtimePlan {
  lightsOut: Date;
  windDownStart: Date;
  wakeUp: Date;
  sleepHours: number;
  reason: string;
  earlyWake: boolean;
}

function tomorrowDate(now: Date): Date {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return t;
}

export function computeSuggestedBedtime(
  settings: SyncedUserSettings,
  tomorrowLeaveBy: LeaveByForBedtime | null,
  now = new Date(),
): BedtimePlan {
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
  };
}
