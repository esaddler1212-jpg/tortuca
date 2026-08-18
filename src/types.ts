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
  /** Hour (0–23) when weekly review shows on Sundays */
  weeklyReviewHour: number;
  /** Street address for live commute origin */
  homeAddress: string;
  /** School or destination address for live commute */
  schoolAddress: string;
  /** Use Google Distance Matrix instead of manual minutes */
  useLiveCommute: boolean;
  /** Email morning briefing via Gmail */
  morningDigestEnabled: boolean;
  /** Web push for leave-by and urgent reminders */
  pushNotificationsEnabled: boolean;
  /** Weekday alarm / wake time HH:MM */
  wakeTime: string;
  /** Hour by which morning workout should be logged */
  morningWorkoutDeadlineHour: number;
  /** Fallback afternoon workout suggestion HH:MM */
  fitnessSuggestTime: string;
  /** Target sleep duration (hours) */
  targetSleepHours: number;
  /** Minutes before lights-out to start winding down */
  windDownMinutes: number;
  /** Minutes from wake to out-the-door (before commute) */
  morningRoutineMinutes: number;
  /** Weekend wake when tomorrow has no commitments */
  weekendWakeTime: string;
}

export type WorkoutType = "arms" | "body" | "legs" | "cardio";

export interface FitnessLog {
  id: string;
  type: WorkoutType;
  date: string;
  loggedAt: string;
  slot: "morning" | "afternoon" | "evening";
}

export interface ShoppingItem {
  id: string;
  name: string;
  /** true = bought / already have — counts toward recipes */
  inPantry: boolean;
  createdAt: string;
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
  city: "Vallejo",
  latitude: 38.1041,
  longitude: -122.2566,
  timezone: "America/Los_Angeles",
  briefingHour: 4,
  woodhouseNodes: [],
  woodhouseNodeUrl: "",
  familyPurposeNodeUrl: "",
  commuteMinutes: 35,
  arriveBufferMinutes: 5,
  schoolStartTime: "08:00",
  schoolName: "Oak Grove Middle School",
  schoolGrade: "78",
  eveningWrapHour: 17,
  weeklyReviewHour: 18,
  homeAddress: "1001 North Regatta Dr, Vallejo, CA 94591",
  schoolAddress: "2050 Minert Rd, Concord, CA 94518",
  useLiveCommute: true,
  morningDigestEnabled: false,
  pushNotificationsEnabled: false,
  wakeTime: "04:15",
  morningWorkoutDeadlineHour: 9,
  fitnessSuggestTime: "17:00",
  targetSleepHours: 7.5,
  windDownMinutes: 30,
  morningRoutineMinutes: 45,
  weekendWakeTime: "08:00",
};
