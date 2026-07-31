import { format } from "date-fns";
import type { CalendarEvent, TodoItem, UserSettings } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import type { WeatherSnapshot } from "../types";
import type { LeaveByPlan } from "./leaveBy";
import type { TodayAction } from "./todayQueue";
import { getDailyQuote } from "./dailyQuote";

export interface EveningWrap {
  headline: string;
  lines: string[];
  completedToday: number;
  remainingTasks: number;
  stillUrgent: number;
  tomorrowPreview?: string;
  quote: { text: string; author: string };
}

function tomorrowKey(timeZone: string): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(t);
}

function eventsOnDay(events: CalendarEvent[], day: string, timeZone: string): CalendarEvent[] {
  return events
    .filter((e) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(e.start)) === day)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function buildEveningWrap(
  settings: UserSettings,
  weather: WeatherSnapshot | null,
  pending: TodoItem[],
  done: TodoItem[],
  actions: TodayAction[],
  allSchedule: CalendarEvent[],
  woodhouse: WoodhouseOrchestrationSnapshot | null,
  tomorrowLeaveBy: LeaveByPlan | null,
  now = new Date(),
): EveningWrap {
  const tz = settings.timezone;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  const completedToday = done.filter((t) => {
    if (!t.completedAt) return false;
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(t.completedAt)) === today;
  }).length;

  const remainingTasks = pending.length;
  const stillUrgent = actions.filter((a) => a.urgent).length;

  const lines: string[] = [];

  if (completedToday > 0) {
    lines.push(`You completed ${completedToday} task${completedToday === 1 ? "" : "s"} today.`);
  }
  if (remainingTasks > 0) {
    lines.push(`${remainingTasks} task${remainingTasks === 1 ? "" : "s"} still open for tonight or tomorrow.`);
  } else {
    lines.push("Your task list is clear — well done.");
  }
  if (stillUrgent > 0) {
    lines.push(`${stillUrgent} urgent item${stillUrgent === 1 ? "" : "s"} remain before you close out the day.`);
  }

  const offline = woodhouse?.nodes.filter((n) => !n.ok) ?? [];
  if (offline.length > 0) {
    lines.push(`${offline.map((n) => n.displayName).join(", ")} could not be reached at last sync.`);
  }

  if (weather) {
    lines.push(
      `Sunset was at ${format(new Date(weather.sunset), "h:mm a")}. Tomorrow in ${settings.city}: high around ${Math.round(weather.high)}°.`,
    );
  }

  const tomorrow = tomorrowKey(tz);
  const tomorrowEvents = eventsOnDay(allSchedule, tomorrow, tz);
  let tomorrowPreview: string | undefined;

  if (tomorrowEvents[0]) {
    tomorrowPreview = `First up tomorrow: ${tomorrowEvents[0].title} at ${format(new Date(tomorrowEvents[0].start), "h:mm a")}.`;
    lines.push(tomorrowPreview);
  } else if (tomorrowLeaveBy) {
    tomorrowPreview = `Tomorrow: leave by ${format(tomorrowLeaveBy.leaveBy, "h:mm a")} for ${tomorrowLeaveBy.destination}.`;
    lines.push(tomorrowPreview);
  } else {
    lines.push("Tomorrow’s calendar looks open so far.");
  }

  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now),
  );
  const headline =
    hour >= settings.eveningWrapHour
      ? "Evening wrap"
      : "Looking ahead";

  const quote = getDailyQuote(tz, now);

  return {
    headline,
    lines,
    completedToday,
    remainingTasks,
    stillUrgent,
    tomorrowPreview,
    quote,
  };
}

export function isEveningMode(settings: UserSettings, now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: settings.timezone,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
  return hour >= settings.eveningWrapHour;
}
