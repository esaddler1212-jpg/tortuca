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

export interface UserSettings {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  briefingHour: number;
  /** Base URL of the Easy Supply Co / Woodhouse store node (no trailing slash). */
  woodhouseNodeUrl: string;
  /** Family Purpose app base URL for woodhouse/v2 calendar node. */
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
  woodhouseNodeUrl: "",
  familyPurposeNodeUrl: "",
};
