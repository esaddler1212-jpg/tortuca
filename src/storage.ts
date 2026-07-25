import type { CheckIn, DebriefSettings } from "./types";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

const CHECKINS_KEY = "tortuca_checkins";
const SETTINGS_KEY = "tortuca_debrief_settings";

/** Parsing the whole log on every keystroke is wasteful; keep it in memory. */
let checkInCache: CheckIn[] | null = null;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getTodayDateLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Drops the in-memory copy so the next read comes from localStorage. */
export function clearCheckInCache(): void {
  checkInCache = null;
}

export function loadAllCheckIns(): CheckIn[] {
  if (checkInCache) return checkInCache;
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    const parsed = raw ? (JSON.parse(raw) as CheckIn[]) : [];
    checkInCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    checkInCache = [];
  }
  return checkInCache;
}

export function saveAllCheckIns(checkIns: CheckIn[]): void {
  checkInCache = checkIns;
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
}

export function isToday(checkIn: CheckIn): boolean {
  return checkIn.createdAt.startsWith(todayKey());
}

export function loadTodayCheckIns(): CheckIn[] {
  return loadAllCheckIns()
    .filter(isToday)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCheckIn(entry: Omit<CheckIn, "id" | "createdAt">): CheckIn {
  const newEntry: CheckIn = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveAllCheckIns([...loadAllCheckIns(), newEntry]);
  return newEntry;
}

export function deleteCheckIn(id: string): void {
  saveAllCheckIns(loadAllCheckIns().filter((c) => c.id !== id));
}

export function loadDebriefSettings(): DebriefSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_DEBRIEF_SETTINGS };
    return { ...DEFAULT_DEBRIEF_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DEBRIEF_SETTINGS };
  }
}

export function saveDebriefSettings(settings: DebriefSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
