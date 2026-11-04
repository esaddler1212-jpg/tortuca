import type { CalendarEvent } from "../types";
import type { TodayAction } from "./todayQueue";

/**
 * What Iris knows during a conversation: a short plain-text summary of the
 * day, built on the device. Family Purpose items are counted, never named, so
 * no student names or details leave the phone.
 */
export function buildAskContext(opts: {
  name?: string;
  now: Date;
  timeZone: string;
  modeLabel: string;
  city: string;
  weather?: string | null;
  leaveBy?: string | null;
  actions: TodayAction[];
  events: CalendarEvent[];
  spark?: { mindset: string; prompt: string };
  pulse?: string;
  goals?: string[];
  desk?: { review: number; working: number };
  channels?: string | null;
  solarPlanets?: string | null;
  /** Inbox headlines, memos, money, gym, shopping (see shared/irisContext.ts). */
  extras?: string[];
}): string {
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: opts.timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(opts.now);
  const isFP = (a: TodayAction) => a.source === "follow-up" || /family purpose/i.test(a.sourceLabel);
  const fpCount = opts.actions.filter(isFP).length;
  const actions = opts.actions.filter((a) => !isFP(a)).slice(0, 8);

  const time = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { timeZone: opts.timeZone, weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const upcoming = opts.events
    .filter((e) => new Date(e.start).getTime() >= opts.now.getTime() - 30 * 60_000)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);
  const fpEvents = upcoming.filter((e) => e.source === "family-purpose").length;

  const lines = [
    `It is ${when} (${opts.timeZone}). Mode: ${opts.modeLabel}. Location: ${opts.city}.`,
    opts.weather ? `Weather: ${opts.weather}.` : "",
    opts.leaveBy ? `Leave by: ${opts.leaveBy}.` : "",
    actions.length ? `Do today: ${actions.map((a) => `${a.title}${a.urgent ? " (urgent)" : ""}`).join("; ")}.` : "Do today: nothing open.",
    fpCount ? `Plus ${fpCount} Family Purpose item${fpCount === 1 ? "" : "s"} (student details withheld).` : "",
    upcoming.filter((e) => e.source !== "family-purpose").length
      ? `Coming up: ${upcoming
          .filter((e) => e.source !== "family-purpose")
          .map((e) => `${e.title} ${time(e.start)}`)
          .join("; ")}.`
      : "",
    fpEvents ? `Plus ${fpEvents} Family Purpose calendar item${fpEvents === 1 ? "" : "s"}.` : "",
    opts.desk && opts.desk.review + opts.desk.working ? `Agent desk: ${opts.desk.review} need E's OK, ${opts.desk.working} with Claude.` : "",
    opts.channels ? opts.channels : "",
    opts.solarPlanets ? `IRIS modules (open with open_planet): ${opts.solarPlanets}.` : "",
    ...(opts.extras ?? []),
    opts.pulse ? `Bay Area: ${opts.pulse}.` : "",
    opts.spark ? `Today's creative spark: ${opts.spark.mindset} Prompt: ${opts.spark.prompt}` : "",
    opts.goals?.length ? `Year goals: ${opts.goals.slice(0, 6).join("; ")}.` : "",
  ];
  return lines.filter(Boolean).join("\n");
}
