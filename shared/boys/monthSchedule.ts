import type { BoysGroup } from "./types";
import { getCurriculumMonth } from "./curriculum";

export const CURRICULUM_TIMEZONE = "America/Los_Angeles";
/** First themed month of the school year. */
export const CURRICULUM_START_MONTH = "2026-09";

export function monthKeyInTz(
  date: Date,
  timeZone = CURRICULUM_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

export function getWeekOfMonth(
  now = new Date(),
  timeZone = CURRICULUM_TIMEZONE,
): number {
  const day = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(now),
  );
  return Math.min(4, Math.ceil(day / 7));
}

export function getCurrentMonthKey(now = new Date()): string {
  return monthKeyInTz(now);
}

export function isBeforeCurriculum(now = new Date()): boolean {
  return getCurrentMonthKey(now) < CURRICULUM_START_MONTH;
}

export function getActiveCurriculumMonth(now = new Date()) {
  const monthKey = getCurrentMonthKey(now);
  if (monthKey < CURRICULUM_START_MONTH) return null;
  return getCurriculumMonth(monthKey) ?? null;
}

export function isGroupSessionWeek(group: BoysGroup, now = new Date()): boolean {
  if (!getActiveCurriculumMonth(now)) return false;
  return getWeekOfMonth(now) === group.sessionWeekOfMonth;
}

export function monthStatusLabel(now = new Date()): string {
  if (isBeforeCurriculum(now)) return "Starts in September";
  const month = getActiveCurriculumMonth(now);
  if (!month) return "School year complete";
  return month.monthLabel;
}

export function canSubmitResponses(group: BoysGroup, now = new Date()): boolean {
  if (!getActiveCurriculumMonth(now)) return false;
  return getWeekOfMonth(now) >= group.sessionWeekOfMonth;
}

export function sessionWeekHint(group: BoysGroup, now = new Date()): string {
  const week = group.sessionWeekOfMonth;
  const ordinals = ["", "first", "second", "third", "fourth"];
  const ordinal = ordinals[week] ?? `${week}th`;
  if (isGroupSessionWeek(group, now)) {
    return `This is your group's week — week ${week} of the month.`;
  }
  const currentWeek = getWeekOfMonth(now);
  if (currentWeek < week) {
    return `Your group meets during the ${ordinal} week of each month (week ${week}).`;
  }
  return `Your group met in week ${week}. You can still submit until the month ends.`;
}
