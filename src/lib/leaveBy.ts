import type { CalendarEvent } from "../types";
import type { UserSettings } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import { isNoSchoolLabel, resolveSchoolSchedule, schoolDismissalHint } from "./schoolBell";
import { dayKey, zonedDateTime } from "../../shared/timezone";

export { dayKey, zonedDateTime };

export interface LeaveByPlan {
  leaveBy: Date;
  arriveBy: Date;
  destination: string;
  reason: string;
  commuteMinutes: number;
  bufferMinutes: number;
  scheduleLabel?: string;
  dismissal?: string;
}

function eventsToday(events: CalendarEvent[], timeZone: string, date = new Date()): CalendarEvent[] {
  const day = dayKey(timeZone, date);
  return events
    .filter((e) => {
      const d = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(e.start));
      return d === day;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function schoolDayLabel(woodhouse: WoodhouseOrchestrationSnapshot | null): string | undefined {
  const edu = woodhouse?.nodes.find((n) => n.nodeType === "education");
  return edu?.snapshot?.calendar?.find((c) => c.kind === "school_day")?.title;
}

export function computeLeaveBy(
  settings: UserSettings,
  woodhouse: WoodhouseOrchestrationSnapshot | null,
  scheduleEvents: CalendarEvent[],
  now = new Date(),
  forDate = now,
  commuteMinutesOverride?: number,
): LeaveByPlan | null {
  const tz = settings.timezone;
  const day = dayKey(tz, forDate);
  const commute = commuteMinutesOverride ?? settings.commuteMinutes;
  const buffer = settings.arriveBufferMinutes;

  const schoolName = settings.schoolName || "Oak Grove Middle School";

  const todayEvents = eventsToday(scheduleEvents, tz, forDate);
  // Only timed events are places to be; all-day items ("No school", birthdays) are not.
  // All-day Google events arrive as "YYYY-MM-DD" or "YYYY-MM-DDT00:00:00" (no offset).
  const isAllDay = (e: CalendarEvent) => /^\d{4}-\d{2}-\d{2}(T00:00:00)?$/.test(e.start);
  const upcomingToday = todayEvents.filter(
    (e) => !isAllDay(e) && !isNoSchoolLabel(e.title) && new Date(e.start) > now,
  );

  let arriveBy: Date | null = null;
  let reason = "";
  let destination = schoolName;
  let scheduleLabel: string | undefined;
  let dismissal: string | undefined;

  const isToday = day === dayKey(tz, now);
  // Woodhouse's school-day label describes today only; don't apply it to other days.
  // A calendar event that day saying "no school", "recess" or "holiday" cancels school.
  const calendarSaysNoSchool = todayEvents.some((e) => isNoSchoolLabel(e.title));
  const bell = calendarSaysNoSchool
    ? null
    : resolveSchoolSchedule(forDate, tz, isToday ? schoolDayLabel(woodhouse) : undefined, settings.schoolGrade);

  if (bell) {
    arriveBy = zonedDateTime(day, bell.firstBell, tz);
    reason = bell.firstPeriod;
    scheduleLabel = bell.label;
    dismissal = schoolDismissalHint(bell.id);
    destination = schoolName;
  } else if (upcomingToday.length > 0) {
    const next = upcomingToday[0];
    arriveBy = new Date(next.start);
    reason = next.title;
    destination = next.location || next.title;
  }

  if (!arriveBy) return null;

  const leaveBy = new Date(arriveBy.getTime() - (commute + buffer) * 60_000);
  const late = isToday && leaveBy < now && arriveBy > now;

  if (isToday && arriveBy <= now && !late) return null;

  return {
    leaveBy,
    arriveBy,
    destination,
    reason: late ? `${reason} — leave now` : reason,
    commuteMinutes: commute,
    bufferMinutes: buffer,
    scheduleLabel,
    dismissal,
  };
}

export function filterTodayTimeline(
  events: CalendarEvent[],
  timeZone: string,
): CalendarEvent[] {
  return eventsOnDay(events, timeZone, new Date());
}

function eventsOnDay(events: CalendarEvent[], timeZone: string, date: Date): CalendarEvent[] {
  const day = dayKey(timeZone, date);
  return events
    .filter((e) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(e.start)) === day)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function filterTomorrowTimeline(events: CalendarEvent[], timeZone: string): CalendarEvent[] {
  return eventsOnDay(events, timeZone, new Date(Date.now() + 24 * 3_600_000));
}
