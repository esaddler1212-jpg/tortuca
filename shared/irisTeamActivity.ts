import type { IrisSpecialistId } from "./irisTeam";
import { IRIS_TEAM, specialistById } from "./irisTeam";
import type { SyncedIrisDelegateLog } from "./userDataTypes";

export interface IrisDelegateLog {
  specialist: IrisSpecialistId;
  at: string;
  task?: string;
  /** Specialist report Iris already relayed — replay on duplicate block. */
  report?: string;
}

const LAST_KEY = "iris-last-delegate";
const HISTORY_KEY = "iris-delegate-history";
const HISTORY_MAX = 40;

/** How long before the same specialist may repeat similar work. */
export function duplicateWindowMs(specialist: IrisSpecialistId): number {
  if (specialist === "scout") return 24 * 60 * 60_000;
  if (specialist === "woodhouse") return 30 * 60_000;
  return 6 * 60 * 60_000;
}

const CROSS_SPECIALIST_MS = 3 * 60 * 60_000;

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
export function tasksSimilar(a: string, b: string): boolean {
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

export function findDuplicateDelegate(
  history: IrisDelegateLog[],
  specialist: IrisSpecialistId,
  task: string,
  now = Date.now(),
): IrisDelegateLog | null {
  const window = duplicateWindowMs(specialist);
  for (const e of history) {
    if (e.specialist !== specialist) continue;
    if (now - Date.parse(e.at) > window) continue;
    if (tasksSimilar(task, e.task ?? "")) return e;
  }
  return null;
}

/** Another specialist already handled similar work recently. */
export function findOverlappingDelegate(
  history: IrisDelegateLog[],
  task: string,
  specialist: IrisSpecialistId,
  now = Date.now(),
): IrisDelegateLog | null {
  for (const e of history) {
    if (e.specialist === specialist || e.specialist === "woodhouse") continue;
    if (now - Date.parse(e.at) > CROSS_SPECIALIST_MS) continue;
    if (tasksSimilar(task, e.task ?? "")) return e;
  }
  return null;
}

export const DUPLICATE_BLOCKED_PREFIX = "DUPLICATE BLOCKED:";

export function duplicateBlockedMessage(prior: IrisDelegateLog, timeZone: string, cross = false): string {
  const who = specialistById(prior.specialist)?.name ?? prior.specialist;
  const ago = formatDelegateAgo(prior.at, timeZone);
  const replay = (prior.report || prior.task || "same work as before").trim().slice(0, 720);
  const lead = cross
    ? `${DUPLICATE_BLOCKED_PREFIX} ${who} already reported on similar work ${ago}. Do not call another specialist — relay this only:`
    : `${DUPLICATE_BLOCKED_PREFIX} ${who} already handled this ${ago}. Do not re-delegate or re-report — relay this only:`;
  return `${lead} ${replay}`;
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
  const dupeLine = dupes.length ? `Duplicate risk (do not re-delegate): ${[...new Set(dupes)].slice(0, 3).join("; ")}.` : "";

  let pendingLine = "";
  if (pendingTask?.trim()) {
    const t = pendingTask.trim();
    const hit = findDuplicateDelegate(recent, "scout", t) ?? recent.find((e) => e.task && tasksSimilar(e.task, t));
    if (hit) {
      const who = specialistById(hit.specialist)?.name ?? hit.specialist;
      pendingLine = `BLOCK consult_specialist — similar work already from ${who} ${formatDelegateAgo(hit.at, "America/Los_Angeles")}. Relay prior report from notes.`;
    }
  }

  return ["Iris team ops (Woodhouse):", loadLine, dupeLine, pendingLine].filter(Boolean).join(" ");
}

export function teamOpsContextForAsk(): string {
  return teamEfficiencySummary(readDelegateHistory());
}

/** Parse delegate history sent from the client on /api/ask. */
export function toSyncedDelegateLog(e: IrisDelegateLog): SyncedIrisDelegateLog {
  return { specialist: e.specialist, at: e.at, task: e.task, report: e.report };
}

/** Merge account + device delegate logs (newest first, dedupe by specialist+at). */
export function mergeDelegateHistories(
  a: IrisDelegateLog[] | SyncedIrisDelegateLog[] | undefined,
  b: IrisDelegateLog[] | SyncedIrisDelegateLog[] | undefined,
): IrisDelegateLog[] {
  const parseOne = (e: IrisDelegateLog | SyncedIrisDelegateLog): IrisDelegateLog | null => {
    if (!e?.specialist || !e?.at) return null;
    if (!specialistById(e.specialist as IrisSpecialistId)) return null;
    return {
      specialist: e.specialist as IrisSpecialistId,
      at: e.at,
      task: e.task,
      report: e.report,
    };
  };
  const byKey = new Map<string, IrisDelegateLog>();
  for (const e of [...(a ?? []), ...(b ?? [])]) {
    const p = parseOne(e);
    if (!p) continue;
    const k = `${p.specialist}:${p.at}`;
    const prev = byKey.get(k);
    if (!prev || ((p.report?.length ?? 0) > (prev.report?.length ?? 0))) byKey.set(k, p);
  }
  return [...byKey.values()]
    .sort((x, y) => Date.parse(y.at) - Date.parse(x.at))
    .slice(0, HISTORY_MAX);
}

/** Apply account delegate history to this device (cross-device dedupe). */
export function hydrateDelegateHistoryFromAccount(remote: SyncedIrisDelegateLog[] | undefined): void {
  if (typeof localStorage === "undefined" || !remote?.length) return;
  const merged = mergeDelegateHistories(readDelegateHistory(), remote);
  if (!merged.length) return;
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(merged[0]));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
  } catch {
    /* private mode */
  }
}

export function parseDelegateHistory(raw: unknown): IrisDelegateLog[] {
  if (!Array.isArray(raw)) return [];
  const out: IrisDelegateLog[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const specialist = o.specialist;
    const at = o.at;
    if (typeof specialist !== "string" || typeof at !== "string") continue;
    if (!specialistById(specialist)) continue;
    out.push({
      specialist: specialist as IrisSpecialistId,
      at,
      task: typeof o.task === "string" ? o.task : undefined,
      report: typeof o.report === "string" ? o.report.slice(0, 800) : undefined,
    });
  }
  return out.slice(0, HISTORY_MAX);
}
