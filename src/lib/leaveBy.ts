import type { CalendarEvent } from "../types";
import type { UserSettings } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";

export interface LeaveByPlan {
  leaveBy: Date;
  arriveBy: Date;
  destination: string;
  reason: string;
  commuteMinutes: number;
  bufferMinutes: number;
}

/** Build a Date for a wall-clock time on a calendar day in an IANA timezone. */
function zonedDateTime(day: string, hhmm: string, timeZone: string): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  let guess = new Date(
    `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`,
  );
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const y = get("year");
    const mo = get("month");
    const da = get("day");
    const h = get("hour");
    const mi = get("minute");
    const gotDay = `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
    if (gotDay === day && h === hour && mi === minute) return guess;
    guess = new Date(guess.getTime() + ((hour - h) * 60 + (minute - mi)) * 60_000);
  }
  return guess;
}

function todayKey(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

function eventsToday(events: CalendarEvent[], timeZone: string): CalendarEvent[] {
  const day = todayKey(timeZone);
  return events
    .filter((e) => {
      const d = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(e.start));
      return d === day;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function isSchoolDay(woodhouse: WoodhouseOrchestrationSnapshot | null): boolean {
  const edu = woodhouse?.nodes.find((n) => n.nodeType === "education");
  const school = edu?.snapshot?.calendar?.find((c) => c.kind === "school_day");
  if (!school) {
    const wd = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date());
    return wd !== "Sat" && wd !== "Sun";
  }
  const label = school.title.toLowerCase();
  return !label.includes("no school") && !label.includes("weekend") && !label.includes("recess");
}

export function computeLeaveBy(
  settings: UserSettings,
  woodhouse: WoodhouseOrchestrationSnapshot | null,
  scheduleEvents: CalendarEvent[],
  now = new Date(),
): LeaveByPlan | null {
  const tz = settings.timezone;
  const day = todayKey(tz);
  const commute = settings.commuteMinutes;
  const buffer = settings.arriveBufferMinutes;

  const edu = woodhouse?.nodes.find((n) => n.nodeType === "education");
  const schoolName = settings.schoolName || edu?.snapshot?.displayName || "School";

  const todayEvents = eventsToday(scheduleEvents, tz);
  const upcomingToday = todayEvents.filter((e) => new Date(e.start) > now);

  let arriveBy: Date | null = null;
  let reason = "";
  let destination = schoolName;

  if (isSchoolDay(woodhouse)) {
    const schoolStart = settings.schoolStartTime || "08:00";
    arriveBy = zonedDateTime(day, schoolStart, tz);
    reason = `First bell ${schoolStart}`;
    destination = settings.schoolName || "Oak Grove Middle School";
  } else if (upcomingToday.length > 0) {
    const next = upcomingToday[0];
    arriveBy = new Date(next.start);
    reason = next.title;
    destination = next.location || next.title;
  }

  if (!arriveBy) return null;

  const leaveBy = new Date(arriveBy.getTime() - (commute + buffer) * 60_000);
  const late = leaveBy < now && arriveBy > now;

  if (arriveBy <= now && !late) return null;

  return {
    leaveBy,
    arriveBy,
    destination,
    reason: late ? `${reason} — leave now` : reason,
    commuteMinutes: commute,
    bufferMinutes: buffer,
  };
}

export function filterTodayTimeline(
  events: CalendarEvent[],
  timeZone: string,
): CalendarEvent[] {
  const day = todayKey(timeZone);
  return events
    .filter((e) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(e.start)) === day)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
