import type { IrisSpecialistId } from "./irisTeam";
import { IRIS_TEAM, specialistById } from "./irisTeam";

export interface IrisDelegateLog {
  specialist: IrisSpecialistId;
  at: string;
  task?: string;
}

const LAST_KEY = "iris-last-delegate";
const HISTORY_KEY = "iris-delegate-history";
const HISTORY_MAX = 40;

export function readLastDelegate(): IrisDelegateLog | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as IrisDelegateLog;
    if (!j?.specialist || !j?.at) return null;
    return j;
  } catch {
    return null;
  }
}

export function readDelegateHistory(): IrisDelegateLog[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      const last = readLastDelegate();
      return last ? [last] : [];
    }
    const arr = JSON.parse(raw) as IrisDelegateLog[];
    if (!Array.isArray(arr)) return [];
    return arr.filter((e) => e?.specialist && e?.at).slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
}

export function writeLastDelegate(log: IrisDelegateLog): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(log));
    const prev = readDelegateHistory().filter((e) => e.at !== log.at || e.specialist !== log.specialist);
    const next = [log, ...prev].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function formatDelegateAgo(iso: string, timeZone: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
      new Date(iso),
    );
  } catch {
    return `${Math.round(hrs / 24)}d ago`;
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Similar tasks (duplicate delegate risk). */
function tasksSimilar(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 12 && y.length >= 12 && (x.includes(y) || y.includes(x))) return true;
  const ax = new Set(x.split(" ").filter((w) => w.length > 3));
  const by = new Set(y.split(" ").filter((w) => w.length > 3));
  if (!ax.size || !by.size) return false;
  let overlap = 0;
  for (const w of ax) if (by.has(w)) overlap++;
  return overlap / Math.min(ax.size, by.size) >= 0.6;
}

/** Plain-text summary for Iris context and Woodhouse consult. */
export function teamEfficiencySummary(history: IrisDelegateLog[], pendingTask?: string): string {
  const dayMs = 24 * 60 * 60_000;
  const recent = history.filter((e) => Date.now() - Date.parse(e.at) < 7 * dayMs);
  if (!recent.length) return "Iris team: no specialist delegates logged yet this week.";

  const counts: Partial<Record<IrisSpecialistId, number>> = {};
  for (const e of recent) counts[e.specialist] = (counts[e.specialist] ?? 0) + 1;
  const load = IRIS_TEAM.map((s) => `${s.name} ${counts[s.id] ?? 0}`)
    .filter((_, i) => (counts[IRIS_TEAM[i].id] ?? 0) > 0)
    .join(", ");
  const loadLine = load ? `Delegates (7d): ${load}.` : "Delegates (7d): none.";

  const dupes: string[] = [];
  for (let i = 0; i < recent.length; i++) {
    for (let j = i + 1; j < recent.length; j++) {
      const a = recent[i];
      const b = recent[j];
      if (!a.task || !b.task) continue;
      if (!tasksSimilar(a.task, b.task)) continue;
      const sa = specialistById(a.specialist)?.name ?? a.specialist;
      const sb = specialistById(b.specialist)?.name ?? b.specialist;
      if (a.specialist === b.specialist) {
        dupes.push(`repeat ${sa} on similar asks`);
      } else {
        dupes.push(`overlap ${sa} and ${sb} on similar work`);
      }
      if (dupes.length >= 3) break;
    }
    if (dupes.length >= 3) break;
  }
  const dupeLine = dupes.length ? `Duplicate risk: ${[...new Set(dupes)].slice(0, 3).join("; ")}.` : "";

  let pendingLine = "";
  if (pendingTask?.trim()) {
    const t = pendingTask.trim();
    const hit = recent.find((e) => e.task && tasksSimilar(e.task, t));
    if (hit) {
      const who = specialistById(hit.specialist)?.name ?? hit.specialist;
      pendingLine = `Heads-up: similar ask went to ${who} ${formatDelegateAgo(hit.at, "America/Los_Angeles")}.`;
    }
  }

  return ["Iris team ops (Woodhouse):", loadLine, dupeLine, pendingLine].filter(Boolean).join(" ");
}

export function teamOpsContextForAsk(): string {
  return teamEfficiencySummary(readDelegateHistory());
}
