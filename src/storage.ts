import type { CheckIn, DebriefSettings } from "./types";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";

const CHECKINS_KEY = "tortuca_checkins";
const SETTINGS_KEY = "tortuca_debrief_settings";

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

export function loadAllCheckIns(): CheckIn[] {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CheckIn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAllCheckIns(checkIns: CheckIn[]): void {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns));
}

export function loadTodayCheckIns(): CheckIn[] {
  const key = todayKey();
  return loadAllCheckIns()
    .filter((c) => c.createdAt.startsWith(key))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCheckIn(
  entry: Omit<CheckIn, "id" | "createdAt">,
): CheckIn {
  const newEntry: CheckIn = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = loadAllCheckIns();
  all.push(newEntry);
  saveAllCheckIns(all);
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
