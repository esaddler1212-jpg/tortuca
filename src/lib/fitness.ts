import type { CalendarEvent, UserSettings } from "../types";

export type WorkoutType = "arms" | "body" | "legs" | "cardio";

export interface FitnessLog {
  id: string;
  type: WorkoutType;
  /** YYYY-MM-DD in user timezone */
  date: string;
  loggedAt: string;
  slot: "morning" | "afternoon" | "evening";
}

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  arms: "Arms",
  body: "Body",
  legs: "Legs",
  cardio: "Cardio",
};

const ROTATION: WorkoutType[] = ["arms", "legs", "body", "cardio"];

export function dayKey(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function workoutSlot(settings: UserSettings, now = new Date()): FitnessLog["slot"] {
  const tz = settings.timezone;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now),
  );
  if (hour < settings.morningWorkoutDeadlineHour) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function todayLog(logs: FitnessLog[], timeZone: string, now = new Date()): FitnessLog | null {
  const day = dayKey(timeZone, now);
  return logs.find((l) => l.date === day) ?? null;
}

export function weekCounts(logs: FitnessLog[], timeZone: string, now = new Date()): Record<WorkoutType, number> {
  const counts: Record<WorkoutType, number> = { arms: 0, body: 0, legs: 0, cardio: 0 };
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  const startKey = dayKey(timeZone, start);
  for (const log of logs) {
    if (log.date >= startKey) counts[log.type]++;
  }
  return counts;
}

export function suggestNextType(logs: FitnessLog[], timeZone: string): WorkoutType {
  const counts = weekCounts(logs, timeZone);
  const last = [...logs].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0];
  if (!last) return "arms";
  const lastIdx = ROTATION.indexOf(last.type);
  const nextInRotation = ROTATION[(lastIdx + 1) % ROTATION.length];
  const minCount = Math.min(...Object.values(counts));
  const neglected = (Object.keys(counts) as WorkoutType[]).filter((k) => counts[k] === minCount);
  if (neglected.includes(nextInRotation)) return nextInRotation;
  return neglected[0] ?? nextInRotation;
}

/** 2026 gym schedule from whiteboard: Tue arms+chest, Thu legs, Sun cardio */
export function scheduledWorkoutForDay(timeZone: string, now = new Date()): WorkoutType | null {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  if (wd === "Tue") return "arms";
  if (wd === "Thu") return "legs";
  if (wd === "Sun") return "cardio";
  return null;
}

export function scheduledWorkoutLabel(type: WorkoutType, timeZone: string, now = new Date()): string {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  if (wd === "Tue" && type === "arms") return "Arms & chest";
  return WORKOUT_LABELS[type];
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function formatTime12(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

/** Find a gap in today's calendar or fall back to settings.fitnessSuggestTime */
export function suggestWorkoutTime(
  settings: UserSettings,
  events: CalendarEvent[],
  now = new Date(),
): string {
  const tz = settings.timezone;
  const day = dayKey(tz, now);
  const todayEvents = events
    .filter((e) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(e.start)) === day)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const { hour: targetH, minute: targetM } = parseTime(settings.fitnessSuggestTime);
  const target = new Date(now);
  target.setHours(targetH, targetM, 0, 0);

  if (target > now) {
    const conflict = todayEvents.some((e) => {
      const start = new Date(e.start);
      const end = e.end ? new Date(e.end) : new Date(start.getTime() + 60 * 60_000);
      return target >= start && target < end;
    });
    if (!conflict) return formatTime12(targetH, targetM);
  }

  for (let i = 0; i < todayEvents.length - 1; i++) {
    const end = todayEvents[i].end
      ? new Date(todayEvents[i].end!)
      : new Date(new Date(todayEvents[i].start).getTime() + 60 * 60_000);
    const nextStart = new Date(todayEvents[i + 1].start);
    const gapMs = nextStart.getTime() - end.getTime();
    if (gapMs >= 45 * 60_000 && end > now) {
      return formatTime12(end.getHours(), end.getMinutes());
    }
  }

  return formatTime12(targetH, targetM);
}

export interface FitnessStatus {
  loggedToday: FitnessLog | null;
  weekCounts: Record<WorkoutType, number>;
  suggestType: WorkoutType;
  scheduledToday: WorkoutType | null;
  scheduledLabel: string | null;
  needsMorningCheck: boolean;
  suggestLaterTime: string | null;
  prompt: string | null;
}

export function buildFitnessStatus(
  settings: UserSettings,
  logs: FitnessLog[],
  events: CalendarEvent[],
  now = new Date(),
): FitnessStatus {
  const tz = settings.timezone;
  const loggedToday = todayLog(logs, tz, now);
  const counts = weekCounts(logs, tz, now);
  const scheduledToday = scheduledWorkoutForDay(tz, now);
  const suggestType = scheduledToday ?? suggestNextType(logs, tz);
  const scheduledLabel = scheduledToday
    ? scheduledWorkoutLabel(scheduledToday, tz, now)
    : null;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now),
  );

  const needsMorningCheck = !loggedToday && hour >= 4 && hour < settings.morningWorkoutDeadlineHour;
  const pastMorningWindow = !loggedToday && hour >= settings.morningWorkoutDeadlineHour;
  const suggestLaterTime = pastMorningWindow ? suggestWorkoutTime(settings, events, now) : null;

  let prompt: string | null = null;
  if (!loggedToday && needsMorningCheck) {
    const label = scheduledLabel ?? WORKOUT_LABELS[suggestType];
    prompt = scheduledToday
      ? `2026 schedule: ${label} today. Did you train yet?`
      : `Good morning, sir. Did you train yet — arms, body, legs, or cardio?`;
  } else if (!loggedToday && pastMorningWindow) {
    const label = scheduledLabel ?? WORKOUT_LABELS[suggestType];
    prompt = `No workout logged. I'd suggest ${label} around ${suggestLaterTime}.`;
  }

  return {
    loggedToday,
    weekCounts: counts,
    suggestType,
    scheduledToday,
    scheduledLabel,
    needsMorningCheck,
    suggestLaterTime,
    prompt,
  };
}

export function parseWorkoutType(text: string): WorkoutType | null {
  const t = text.toLowerCase();
  if (/\b(arms?|upper|push|biceps|triceps)\b/.test(t)) return "arms";
  if (/\b(legs?|lower|squat)\b/.test(t)) return "legs";
  if (/\b(body|core|full.?body|abs)\b/.test(t)) return "body";
  if (/\b(cardio|run|bike|walk|hiit)\b/.test(t)) return "cardio";
  return null;
}
