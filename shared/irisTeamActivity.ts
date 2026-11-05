import type { IrisSpecialistId } from "./irisTeam";

export interface IrisDelegateLog {
  specialist: IrisSpecialistId;
  at: string;
  task?: string;
}

const STORAGE_KEY = "iris-last-delegate";

export function readLastDelegate(): IrisDelegateLog | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as IrisDelegateLog;
    if (!j?.specialist || !j?.at) return null;
    return j;
  } catch {
    return null;
  }
}

export function writeLastDelegate(log: IrisDelegateLog): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
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
