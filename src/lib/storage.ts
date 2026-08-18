import type { UserSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { migrateWoodhouseNodes } from "./woodhouseRegistry";

const SETTINGS_KEY = "alfred-settings";
const SESSION_KEY = "alfred-session-id";
const TODOS_KEY = "alfred-todos";
const LOCAL_EVENTS_KEY = "alfred-local-events";

const VALLEJO_COMMUTE_DEFAULTS: Partial<UserSettings> = {
  city: "Vallejo",
  latitude: 38.1041,
  longitude: -122.2566,
  timezone: "America/Los_Angeles",
  homeAddress: "1001 North Regatta Dr, Vallejo, CA 94591",
  schoolAddress: "2050 Minert Rd, Concord, CA 94518",
  commuteMinutes: 35,
  useLiveCommute: true,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as UserSettings;
    parsed.woodhouseNodes = migrateWoodhouseNodes(parsed);
    // One-time upgrade from generic NYC defaults → Vallejo → Concord commute
    if (
      parsed.city === "New York" &&
      (!parsed.homeAddress || parsed.homeAddress === "Vallejo, CA") &&
      parsed.latitude === 40.7128
    ) {
      return { ...parsed, ...VALLEJO_COMMUTE_DEFAULTS };
    }
    if (parsed.homeAddress === "Vallejo, CA") {
      return { ...parsed, homeAddress: VALLEJO_COMMUTE_DEFAULTS.homeAddress! };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export { TODOS_KEY, LOCAL_EVENTS_KEY };
