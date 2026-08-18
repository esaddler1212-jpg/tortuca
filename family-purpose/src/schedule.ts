/**
 * Oak Grove Middle School bell schedule, 2026–2027.
 *
 * Four variants: 6th grade and 7th/8th grade differ only in when lunch falls,
 * Wednesday is an early-release day for all grades, and minimum days end at
 * noon. Times are local "HH:MM" so they compare as strings.
 */

import { describeDay, isMinimumDay } from "./schoolCalendar";

export const SCHOOL_NAME = "Oak Grove Middle School";

export interface BellPeriod {
  name: string;
  start: string;
  end: string;
  /** Lunch is on the schedule but is not a class period. */
  instructional: boolean;
}

export type ScheduleId = "grade6" | "grade78" | "wednesday" | "minimum";

export interface BellSchedule {
  id: ScheduleId;
  label: string;
  periods: BellPeriod[];
}

function classPeriod(name: string, start: string, end: string): BellPeriod {
  return { name, start, end, instructional: true };
}

function lunch(start: string, end: string): BellPeriod {
  return { name: "Lunch", start, end, instructional: false };
}

export const BELL_SCHEDULES: Record<ScheduleId, BellSchedule> = {
  grade6: {
    id: "grade6",
    label: "6th grade — Mon, Tue, Thu, Fri",
    periods: [
      classPeriod("Advisory", "08:00", "08:29"),
      classPeriod("Period 1", "08:30", "09:12"),
      classPeriod("Period 2", "09:16", "09:58"),
      classPeriod("Period 3", "10:02", "10:44"),
      classPeriod("Period 4", "10:48", "11:30"),
      lunch("11:30", "12:00"),
      classPeriod("Period 5", "12:04", "12:46"),
      classPeriod("Period 6", "12:50", "13:32"),
      classPeriod("Period 7", "13:36", "14:18"),
    ],
  },
  grade78: {
    id: "grade78",
    label: "7th & 8th grade — Mon, Tue, Thu, Fri",
    periods: [
      classPeriod("Advisory", "08:00", "08:29"),
      classPeriod("Period 1", "08:30", "09:12"),
      classPeriod("Period 2", "09:16", "09:58"),
      classPeriod("Period 3", "10:02", "10:44"),
      classPeriod("Period 4", "10:48", "11:30"),
      classPeriod("Period 5", "11:34", "12:16"),
      lunch("12:16", "12:46"),
      classPeriod("Period 6", "12:50", "13:32"),
      classPeriod("Period 7", "13:36", "14:18"),
    ],
  },
  wednesday: {
    id: "wednesday",
    label: "Wednesday early release — all grades",
    periods: [
      classPeriod("Period 1", "08:00", "08:37"),
      classPeriod("Period 2", "08:41", "09:18"),
      classPeriod("Period 3", "09:22", "09:59"),
      classPeriod("Period 4", "10:03", "10:40"),
      classPeriod("Period 5", "10:44", "11:21"),
      classPeriod("Period 6", "11:25", "12:02"),
      classPeriod("Period 7", "12:06", "12:43"),
    ],
  },
  minimum: {
    id: "minimum",
    label: "Minimum day — all grades",
    periods: [
      classPeriod("Period 1", "08:00", "08:31"),
      classPeriod("Period 2", "08:35", "09:06"),
      classPeriod("Period 3", "09:10", "09:41"),
      classPeriod("Period 4", "09:45", "10:16"),
      classPeriod("Period 5", "10:20", "10:51"),
      classPeriod("Period 6", "10:55", "11:26"),
      classPeriod("Period 7", "11:30", "12:00"),
    ],
  },
};

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clockTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Which bell schedule is in effect, given the date and the student's grade. */
export function scheduleFor(date: Date, grade: string): BellSchedule {
  const day = dayKey(date);
  if (isMinimumDay(day)) return BELL_SCHEDULES.minimum;
  if (date.getDay() === 3) return BELL_SCHEDULES.wednesday;
  // Only 6th grade takes the earlier lunch; everyone else follows 7th and 8th.
  return grade === "6" ? BELL_SCHEDULES.grade6 : BELL_SCHEDULES.grade78;
}

export function classPeriods(schedule: BellSchedule): BellPeriod[] {
  return schedule.periods.filter((p) => p.instructional);
}

/** The period covering a moment, or null outside the school day. */
export function periodAt(date: Date, grade: string): BellPeriod | null {
  const now = clockTime(date);
  const schedule = scheduleFor(date, grade);
  return (
    schedule.periods.find((p) => now >= p.start && now < p.end) ?? null
  );
}

/**
 * The class period to pre-fill. Lunch and passing periods fall back to the
 * period just finished, which is the class the student is coming from.
 */
export function suggestedPeriod(date: Date, grade: string): BellPeriod | null {
  const day = dayKey(date);
  if (!describeDay(day).isSchoolDay) return null;

  const now = clockTime(date);
  const schedule = scheduleFor(date, grade);
  const current = periodAt(date, grade);
  if (current?.instructional) return current;

  const finished = classPeriods(schedule).filter((p) => p.end <= now);
  return finished.length > 0 ? finished[finished.length - 1] : null;
}

export function formatClock(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPeriodRange(period: BellPeriod): string {
  return `${formatClock(period.start)}–${formatClock(period.end)}`;
}
