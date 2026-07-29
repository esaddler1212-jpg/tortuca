export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: string;
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
};
