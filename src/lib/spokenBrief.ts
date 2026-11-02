import type { CalendarEvent, WeatherSnapshot } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import type { LeaveByPlan } from "./leaveBy";
import type { TodayAction } from "./todayQueue";
import { weatherLabel } from "./weather";
import { DAY_MODE_LABEL, type DayMode } from "../../shared/dayMode";
import { dayKey, localHour, weekdayOfDay } from "../../shared/timezone";

const time = (iso: string | Date, tz: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Timed events in the next `days` days, soonest first (all-day items skipped). */
export function upcomingEvents(events: CalendarEvent[], now: Date, days: number): CalendarEvent[] {
  const end = now.getTime() + days * 86_400_000;
  return events
    .filter((e) => !/^\d{4}-\d{2}-\d{2}(T00:00:00)?$/.test(e.start))
    .filter((e) => {
      const t = new Date(e.start).getTime();
      return t > now.getTime() && t < end;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Make on-screen text read naturally: "0/2" → "0 of 2", drop symbol lists, tidy punctuation. */
export function forSpeech(text: string): string {
  return text
    .replace(/\s*\((?:[✓○]\s*)+\)/g, "") // "(✓ ○)" check lists
    .replace(/(\d+)\/(\d+)/g, "$1 of $2")
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s*—\s*/g, ": ")
    .replace(/[✓]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/, "");
}

/** "Brief me": a short spoken rundown of today. */
export function buildDailyBrief(opts: {
  name?: string;
  tz: string;
  now: Date;
  mode: DayMode;
  city: string;
  weather: WeatherSnapshot | null;
  leaveBy: LeaveByPlan | null;
  actions: TodayAction[];
  events: CalendarEvent[];
  spark?: { mindset: string; prompt: string };
  /** Today's gym session title, if it's a gym day. */
  gym?: string;
  /** Bay Area Pulse summary, only when something needs attention. */
  pulse?: string;
}): string {
  const { tz, now, weather, leaveBy } = opts;
  const h = localHour(tz, now);
  const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const parts: string[] = [`${hello}${opts.name ? `, ${opts.name}` : ""}.`];
  parts.push(`You're in ${DAY_MODE_LABEL[opts.mode].replace(" · ", ", ")} mode.`);
  if (weather) {
    parts.push(
      `It's ${Math.round(weather.temperature)} degrees and ${weatherLabel(weather.weatherCode).toLowerCase()} in ${opts.city}, with a high of ${Math.round(weather.high)}.`,
    );
  }
  if (leaveBy) parts.push(`Leave by ${time(leaveBy.leaveBy, tz)} for ${leaveBy.destination}.`);
  const open = opts.actions.slice(0, 3).map((a) => a.title);
  if (open.length) parts.push(`On your list: ${list(open)}.`);
  else parts.push("Your list is clear.");
  const today = dayKey(tz, now);
  const next = upcomingEvents(opts.events, now, 1).find((e) => dayKey(tz, new Date(e.start)) === today);
  if (next) parts.push(`Next on the calendar: ${next.title} at ${time(next.start, tz)}.`);
  if (opts.pulse) parts.push(`Around the Bay: ${forSpeech(opts.pulse)}.`);
  if (opts.gym) parts.push(`Gym day: ${opts.gym}.`);
  if (opts.spark) parts.push(`Today's spark: ${forSpeech(opts.spark.mindset)} And a prompt: ${forSpeech(opts.spark.prompt)}`);
  return parts.join(" ");
}

/** Vantage Point briefing: the big picture, written to be read aloud. */
export function buildVantageBrief(opts: {
  name?: string;
  tz: string;
  now: Date;
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  goals: string[];
  weather: WeatherSnapshot | null;
  events: CalendarEvent[];
  spark?: { mindset: string; prompt: string };
  desk?: { review: number; working: number };
  pulse?: string;
  /** ECS Chief of Staff headlines (shared/chiefOfStaff.ts cosHeadlines). */
  cos?: string[];
}): { lines: { label: string; text: string }[]; spoken: string } {
  const lines: { label: string; text: string }[] = [];
  const roadmap = opts.woodhouse?.nodes.find((n) => n.registryId === "ecs-roadmap")?.snapshot;
  if (roadmap) {
    lines.push({ label: "ECS roadmap", text: roadmap.summary });
    const actions = roadmap.priorityActions.slice(0, 3);
    if (actions.length) lines.push({ label: "Moves that matter", text: actions.join(" · ") });
  }
  if (opts.cos?.length) {
    lines.push({ label: "Chief of Staff", text: opts.cos.slice(0, 3).join(" ").replace(/\.$/, "") });
  }
  const week = upcomingEvents(opts.events, opts.now, 7);
  lines.push({
    label: "This week",
    text: week.length
      ? `${week.length} event${week.length === 1 ? "" : "s"}. Next: ${week
          .slice(0, 3)
          .map((e) => `${e.title} (${weekdayOfDay(dayKey(opts.tz, new Date(e.start)))} ${time(e.start, opts.tz)})`)
          .join(" · ")}`
      : "Nothing on the calendar for the next 7 days.",
  });
  const days = opts.weather?.week ?? [];
  if (days.length) {
    const rainy = days.filter((d) => d.rainChance >= 50).map((d) => weekdayOfDay(d.date));
    lines.push({
      label: "Weather",
      text: rainy.length ? `Rain likely ${rainy.join(", ")}.` : "Dry week ahead.",
    });
  }
  if (opts.pulse) lines.push({ label: "Bay Area", text: opts.pulse });
  if (opts.desk && opts.desk.review + opts.desk.working > 0) {
    lines.push({
      label: "Agent desk",
      text: `${opts.desk.review} need${opts.desk.review === 1 ? "s" : ""} your OK, ${opts.desk.working} with Claude`,
    });
  }
  if (opts.spark) lines.push({ label: "Creative spark", text: `${opts.spark.mindset} ${opts.spark.prompt}` });
  if (opts.goals.length) lines.push({ label: "2026 goals", text: opts.goals.join(" · ") });

  const spoken = [
    `Here's your Vantage Point briefing${opts.name ? `, ${opts.name}` : ""}.`,
    ...lines.map((l) => `${l.label}: ${forSpeech(l.text)}.`),
  ].join(" ");
  return { lines, spoken };
}
