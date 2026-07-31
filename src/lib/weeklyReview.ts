import { format } from "date-fns";
import type { CalendarEvent, TodoItem, UserSettings } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import { MINIMUM_DAYS } from "./schoolBell";
import { getDailyQuote } from "./dailyQuote";

export interface WeeklyReview {
  headline: string;
  lines: string[];
  completedThisWeek: number;
  openTasks: number;
  upcomingSchoolDays: string[];
  quote: { text: string; author: string };
}

function weekStart(date: Date, timeZone: string): Date {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  const offsets: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const d = new Date(date);
  d.setDate(d.getDate() - (offsets[day] ?? 0));
  return d;
}

function inWeek(iso: string, start: Date, timeZone: string): boolean {
  const t = new Date(iso);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const tk = key(t);
  return tk >= key(start) && tk < key(end);
}

export function isWeeklyReviewTime(settings: UserSettings, now = new Date()): boolean {
  const tz = settings.timezone;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now),
  );
  return weekday === "Sun" && hour >= settings.weeklyReviewHour;
}

export function buildWeeklyReview(
  settings: UserSettings,
  pending: TodoItem[],
  done: TodoItem[],
  allSchedule: CalendarEvent[],
  woodhouse: WoodhouseOrchestrationSnapshot | null,
  now = new Date(),
): WeeklyReview {
  const tz = settings.timezone;
  const start = weekStart(now, tz);
  const completedThisWeek = done.filter((t) => t.completedAt && inWeek(t.completedAt, start, tz)).length;
  const openTasks = pending.length;
  const quote = getDailyQuote(tz, now);

  const lines: string[] = [];
  lines.push(`This week you completed ${completedThisWeek} task${completedThisWeek === 1 ? "" : "s"}.`);
  if (openTasks > 0) {
    lines.push(`${openTasks} still open heading into the new week.`);
  } else {
    lines.push("Task list is clear — strong finish.");
  }

  const edu = woodhouse?.nodes.find((n) => n.nodeType === "education");
  const overdue = edu?.snapshot?.calendar?.filter((c) => c.kind === "follow_up_overdue") ?? [];
  if (overdue.length > 0) {
    lines.push(`${overdue.length} overdue follow-up${overdue.length === 1 ? "" : "s"} from Family Purpose.`);
  }

  const commerce = woodhouse?.nodes.find((n) => n.nodeType === "commerce");
  if (commerce?.snapshot?.summary) {
    lines.push(`Easy Supply: ${commerce.snapshot.summary}`);
  }

  const upcomingSchoolDays: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d);
    if (wd === "Sat" || wd === "Sun") continue;
    if (MINIMUM_DAYS.includes(key)) {
      upcomingSchoolDays.push(`${format(d, "EEE M/d")} — minimum day (12:00 dismissal)`);
    } else if (wd === "Wed") {
      upcomingSchoolDays.push(`${format(d, "EEE M/d")} — early release (12:43)`);
    }
  }
  if (upcomingSchoolDays.length > 0) {
    lines.push(`School schedule ahead: ${upcomingSchoolDays.slice(0, 3).join("; ")}.`);
  }

  const weekEvents = allSchedule.filter((e) => inWeek(e.start, start, tz));
  if (weekEvents.length > 0) {
    lines.push(`${weekEvents.length} calendar event${weekEvents.length === 1 ? "" : "s"} on the books this week.`);
  }

  return {
    headline: "Weekly review",
    lines,
    completedThisWeek,
    openTasks,
    upcomingSchoolDays,
    quote,
  };
}
