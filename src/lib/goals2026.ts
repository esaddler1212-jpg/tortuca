/** Eric's 2026 whiteboard goals — operator targets for the year. */

export const GOALS_YEAR = 2026;

export const YEAR_MOTTO = "Tomorrow Starts Today";
export const YEAR_MOTTO_NOTE = "DEC";

export const YEAR_QUOTE = {
  text: "Iceman was an ice man. Now I'm hot & cold.",
  author: "Eric",
};

export interface TravelTarget {
  id: string;
  label: string;
}

export const TRAVEL_TARGETS: TravelTarget[] = [
  { id: "pr", label: "Puerto Rico (solo)" },
  { id: "reno-vegas", label: "Reno / Vegas (solo)" },
];

export const MWFS_HABITS = ["music", "meditate", "master"] as const;
export type MwfsHabit = (typeof MWFS_HABITS)[number];

export const MWFS_LABELS: Record<MwfsHabit, string> = {
  music: "Music",
  meditate: "Meditate",
  master: "Master",
};

/** Mon, Wed, Fri, Sat — Music · Meditate · Master */
export const MWFS_WEEKDAYS = new Set(["Mon", "Wed", "Fri", "Sat"]);

export interface Goals2026Progress {
  trips: Record<string, boolean>;
  mwfsLog: Record<string, Partial<Record<MwfsHabit, boolean>>>;
  aiAgents: boolean;
}

export const DEFAULT_GOALS_PROGRESS: Goals2026Progress = {
  trips: { pr: false, "reno-vegas": false },
  mwfsLog: {},
  aiAgents: false,
};

export function isMwfsDay(timeZone: string, date = new Date()): boolean {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return MWFS_WEEKDAYS.has(wd);
}

export function dayKey(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function tripsCompleted(progress: Goals2026Progress): number {
  return TRAVEL_TARGETS.filter((t) => progress.trips[t.id]).length;
}

export function mwfsDoneToday(progress: Goals2026Progress, timeZone: string, date = new Date()): number {
  const key = dayKey(timeZone, date);
  const log = progress.mwfsLog[key] ?? {};
  return MWFS_HABITS.filter((h) => log[h]).length;
}

export function buildGoalsSummary(progress: Goals2026Progress, timeZone: string): string[] {
  const lines: string[] = [];
  const trips = tripsCompleted(progress);
  lines.push(`Solo trips: ${trips}/2 (${TRAVEL_TARGETS.map((t) => (progress.trips[t.id] ? "✓" : "○")).join(" ")})`);
  if (progress.aiAgents) lines.push("AI Agents — in progress ✓");
  else lines.push("AI Agents — not started yet");
  if (isMwfsDay(timeZone)) {
    const done = mwfsDoneToday(progress, timeZone);
    lines.push(`MWFS today: ${done}/3 (Music · Meditate · Master)`);
  }
  return lines;
}
