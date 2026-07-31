import type { UserSettings } from "../types";
import type { LeaveByPlan } from "./leaveBy";
import { parseWorkoutType, type WorkoutType } from "./fitness";
import { format } from "date-fns";

export type CommandAction =
  | { kind: "todo"; title: string; dueDate?: string; message: string }
  | { kind: "fitness"; type: WorkoutType; message: string }
  | { kind: "event"; title: string; start: string; message: string }
  | { kind: "reply"; message: string }
  | { kind: "noop"; message: string };

function todayKey(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

function parseDueDate(text: string, timeZone: string): string | undefined {
  const t = text.toLowerCase();
  const today = todayKey(timeZone);
  if (/\btoday\b/.test(t)) return today;
  if (/\btomorrow\b/.test(t)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  }
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < days.length; i++) {
    if (t.includes(days[i])) {
      const now = new Date();
      const current = now.getDay();
      let diff = i - current;
      if (diff <= 0) diff += 7;
      const target = new Date(now);
      target.setDate(target.getDate() + diff);
      return new Intl.DateTimeFormat("en-CA", { timeZone }).format(target);
    }
  }
  return undefined;
}

function extractTitle(text: string): string {
  return text
    .replace(/^(add|task|todo|remind me to|remember to)\s+/i, "")
    .replace(/\b(for today|today|tomorrow)\b/gi, "")
    .trim();
}

export function parseCommand(
  raw: string,
  settings: UserSettings,
  leaveBy: LeaveByPlan | null,
): CommandAction {
  const text = raw.trim();
  if (!text) return { kind: "noop", message: "I'm listening, sir." };

  const lower = text.toLowerCase();

  if (/^(brief|briefing|status|what'?s new|overnight)/.test(lower)) {
    return { kind: "reply", message: "Check the briefing banner at the top for what's changed since your last visit." };
  }

  if (/leave.?by|when (do i|should i) leave|commute/.test(lower)) {
    if (leaveBy) {
      return {
        kind: "reply",
        message: `Leave by ${format(leaveBy.leaveBy, "h:mm a")} for ${leaveBy.destination}. Arrive ${format(leaveBy.arriveBy, "h:mm a")}.`,
      };
    }
    return { kind: "reply", message: "No leave-by window right now — calendar looks clear." };
  }

  const workout =
    parseWorkoutType(lower) ??
    (/(did|log|finished|completed)\s+.+(workout|train)/.test(lower) ? parseWorkoutType(lower) : null);
  if (workout && /(did|log|finished|completed|arms|legs|body|cardio)/.test(lower)) {
    return {
      kind: "fitness",
      type: workout,
      message: `Logged ${workout} workout. Well done, sir.`,
    };
  }

  if (/^what (should|to) (i )?train|workout suggestion/.test(lower)) {
    const w = parseWorkoutType(lower);
    if (w) {
      return { kind: "fitness", type: w, message: `Logging ${w} for today.` };
    }
    return { kind: "reply", message: "Tap Arms, Body, Legs, or Cardio in the fitness panel — or say “log legs”." };
  }

  const blockMatch = lower.match(/block\s+(\d+(?:\.\d+)?)\s*h(?:our)?s?\s+(?:for\s+)?(.+)/);
  if (blockMatch) {
    const hours = Number(blockMatch[1]);
    const title = blockMatch[2].trim() || "Deep work";
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    return {
      kind: "event",
      title: title.charAt(0).toUpperCase() + title.slice(1),
      start: start.toISOString(),
      message: `Blocked ${hours}h for “${title}” starting ${format(start, "h:mm a")}.`,
    };
  }

  if (/^(add|task|todo|remind|remember)\b/.test(lower) || lower.startsWith("buy ")) {
    const title = extractTitle(text);
    const dueDate = parseDueDate(lower, settings.timezone);
    return {
      kind: "todo",
      title: title || text,
      dueDate,
      message: dueDate ? `Added task for ${dueDate}.` : "Added to your task list.",
    };
  }

  if (lower.endsWith("?")) {
    return { kind: "reply", message: "Try: “leave by”, “log cardio”, “add call dentist Friday”, or “block 2 hours for deep work”." };
  }

  return {
    kind: "todo",
    title: text,
    dueDate: parseDueDate(lower, settings.timezone),
    message: "Added to your task list.",
  };
}
