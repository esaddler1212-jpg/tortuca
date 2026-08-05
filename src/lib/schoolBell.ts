/** Oak Grove Middle School bell schedules (aligned with Family Purpose app). */

export type ScheduleId = "grade6" | "grade78" | "wednesday" | "minimum";

export const MINIMUM_DAYS = [
  "2026-09-01",
  "2026-10-02",
  "2026-12-01",
  "2026-12-18",
  "2027-02-12",
  "2027-03-09",
  "2027-04-02",
  "2027-05-07",
  "2027-06-02",
];

const SCHEDULES: Record<ScheduleId, { label: string; firstBell: string; firstPeriod: string }> = {
  grade6: {
    label: "6th grade — Mon, Tue, Thu, Fri",
    firstBell: "08:00",
    firstPeriod: "Advisory 8:00",
  },
  grade78: {
    label: "7th & 8th grade — Mon, Tue, Thu, Fri",
    firstBell: "08:00",
    firstPeriod: "Advisory 8:00",
  },
  wednesday: {
    label: "Wednesday early release — all grades",
    firstBell: "08:00",
    firstPeriod: "Period 1 8:00 (no advisory)",
  },
  minimum: {
    label: "Minimum day — ends 12:00 PM",
    firstBell: "08:00",
    firstPeriod: "Period 1 8:00",
  },
};

function dayKeyInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

function weekdayShort(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
}

export function resolveSchoolSchedule(
  date: Date,
  timeZone: string,
  schoolDayLabel?: string,
  grade: "6" | "78" = "78",
): { id: ScheduleId; label: string; firstBell: string; firstPeriod: string } | null {
  const day = dayKeyInTz(date, timeZone);
  const label = (schoolDayLabel ?? "").toLowerCase();

  if (label.includes("no school") || label.includes("weekend") || label.includes("recess")) {
    return null;
  }

  if (MINIMUM_DAYS.includes(day) || label.includes("minimum")) {
    return { id: "minimum", ...SCHEDULES.minimum };
  }

  if (weekdayShort(date, timeZone) === "Wed" || label.includes("wednesday") || label.includes("early release")) {
    return { id: "wednesday", ...SCHEDULES.wednesday };
  }

  const wd = weekdayShort(date, timeZone);
  if (wd === "Sat" || wd === "Sun") return null;

  if (grade === "6") {
    return { id: "grade6", ...SCHEDULES.grade6 };
  }
  return { id: "grade78", ...SCHEDULES.grade78 };
}

export function schoolDismissalHint(scheduleId: ScheduleId): string {
  if (scheduleId === "wednesday") return "Dismissal 12:43 PM";
  if (scheduleId === "minimum") return "Dismissal 12:00 PM";
  return "Dismissal 2:18 PM";
}
