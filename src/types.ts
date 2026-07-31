export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  source: "google" | "local" | "family-purpose";
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  unread: boolean;
}

import type { WoodhouseRegistryEntry } from "./types/woodhouse";

export interface UserSettings {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  briefingHour: number;
  /** Registered Woodhouse app nodes (Alfred syncs all of these). */
  woodhouseNodes: WoodhouseRegistryEntry[];
  /** @deprecated Use woodhouseNodes — migrated on load */
  woodhouseNodeUrl: string;
  /** @deprecated Use woodhouseNodes — migrated on load */
  familyPurposeNodeUrl: string;
  /** Minutes to drive to school / first commitment */
  commuteMinutes: number;
  /** Extra minutes before arrival */
  arriveBufferMinutes: number;
  /** Local HH:MM first bell / arrival target on school days */
  schoolStartTime: string;
  schoolName: string;
  /** 6th vs 7th/8th — affects lunch schedule label; same first bell */
  schoolGrade: "6" | "78";
  /** Hour (0–23) when evening wrap is emphasized */
  eveningWrapHour: number;
}

export interface WeatherSnapshot {
  temperature: number;
  weatherCode: number;
  high: number;
  low: number;
  sunset: string;
  sunrise: string;
  fetchedAt: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  city: "New York",
  latitude: 40.7128,
  longitude: -74.006,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  briefingHour: 8,
  woodhouseNodes: [],
  woodhouseNodeUrl: "",
  familyPurposeNodeUrl: "",
  commuteMinutes: 25,
  arriveBufferMinutes: 5,
  schoolStartTime: "08:00",
  schoolName: "Oak Grove Middle School",
  schoolGrade: "78",
  eveningWrapHour: 17,
};
