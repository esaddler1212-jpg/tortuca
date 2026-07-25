import type {
  CheckIn,
  DebriefSettings,
  GroupMember,
  GroupSession,
} from "./types";
import { DEFAULT_DEBRIEF_SETTINGS } from "./types";
import { dayKeyOf } from "./reports";

export const CHECKINS_KEY = "familypurpose_checkins";
export const SETTINGS_KEY = "familypurpose_debrief_settings";
export const GROUP_MEMBERS_KEY = "familypurpose_group_members";
export const GROUP_SESSIONS_KEY = "familypurpose_group_sessions";

/** Keys used before the app was named, kept so early data is not stranded. */
const RENAMED_KEYS: [from: string, to: string][] = [
  ["tortuca_checkins", CHECKINS_KEY],
  ["tortuca_debrief_settings", SETTINGS_KEY],
  ["tortuca_group_members", GROUP_MEMBERS_KEY],
  ["tortuca_group_sessions", GROUP_SESSIONS_KEY],
];

export function migrateRenamedKeys(): void {
  for (const [from, to] of RENAMED_KEYS) {
    const value = localStorage.getItem(from);
    if (value === null || localStorage.getItem(to) !== null) continue;
    localStorage.setItem(to, value);
    localStorage.removeItem(from);
  }
  clearCheckInCache();
}

/** Parsing the whole log on every keystroke is wasteful; keep it in memory. */
let checkInCache: CheckIn[] | null = null;

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDayLabel(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
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
  return dayKeyOf(checkIn.createdAt) === todayKey();
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

/** Applies a partial edit to one check-in, such as recording its outcome. */
export function updateCheckIn(
  id: string,
  patch: Partial<Omit<CheckIn, "id" | "createdAt">>,
): CheckIn | null {
  const checkIns = loadAllCheckIns();
  const index = checkIns.findIndex((c) => c.id === id);
  if (index < 0) return null;
  const updated = { ...checkIns[index], ...patch };
  const next = [...checkIns];
  next[index] = updated;
  saveAllCheckIns(next);
  return updated;
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

export function loadGroupMembers(): GroupMember[] {
  return readJson<GroupMember[]>(GROUP_MEMBERS_KEY, []);
}

export function saveGroupMembers(members: GroupMember[]): void {
  localStorage.setItem(GROUP_MEMBERS_KEY, JSON.stringify(members));
}

export function loadGroupSessions(): GroupSession[] {
  return readJson<GroupSession[]>(GROUP_SESSIONS_KEY, []);
}

export function saveGroupSessions(sessions: GroupSession[]): void {
  localStorage.setItem(GROUP_SESSIONS_KEY, JSON.stringify(sessions));
}

/** Returns the session for a day, creating an empty one if it is the first. */
export function getOrCreateSession(day: string): GroupSession {
  const existing = loadGroupSessions().find((s) => s.date === day);
  if (existing) return existing;
  return {
    id: crypto.randomUUID(),
    date: day,
    topic: "",
    notes: "",
    attendees: [],
    updatedAt: new Date().toISOString(),
  };
}

export function saveSession(session: GroupSession): GroupSession {
  const updated = { ...session, updatedAt: new Date().toISOString() };
  const sessions = loadGroupSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) sessions[index] = updated;
  else sessions.push(updated);
  saveGroupSessions(sessions);
  return updated;
}
