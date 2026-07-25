/**
 * Mt. Diablo Unified School District instructional calendar, 2026–2027.
 * Board approved 12/18/2024, revised 6/10/2026.
 *
 * Term boundaries here are contiguous so that every day of the year belongs to
 * exactly one term. The instructional first and last days are tracked
 * separately, since a term often opens on a recess day.
 */

export const SCHOOL_YEAR_LABEL = "2026–2027";
export const FIRST_STUDENT_DAY = "2026-08-06";
export const LAST_STUDENT_DAY = "2027-06-02";

export type TermKind = "year" | "quarter" | "semester" | "trimester";

export interface SchoolTerm {
  id: string;
  kind: TermKind;
  label: string;
  /** Inclusive, contiguous with the neighbouring term. */
  start: string;
  end: string;
  /** First and last day students are actually in school. */
  firstSchoolDay: string;
  lastSchoolDay: string;
  /** Instructional days, from the district calendar. */
  days: number;
}

export const SCHOOL_TERMS: SchoolTerm[] = [
  {
    id: "sy",
    kind: "year",
    label: "Full school year",
    start: FIRST_STUDENT_DAY,
    end: LAST_STUDENT_DAY,
    firstSchoolDay: FIRST_STUDENT_DAY,
    lastSchoolDay: LAST_STUDENT_DAY,
    days: 180,
  },
  {
    id: "q1",
    kind: "quarter",
    label: "Quarter 1",
    start: "2026-08-06",
    end: "2026-10-02",
    firstSchoolDay: "2026-08-06",
    lastSchoolDay: "2026-10-02",
    days: 41,
  },
  {
    id: "q2",
    kind: "quarter",
    label: "Quarter 2",
    start: "2026-10-03",
    end: "2026-12-18",
    firstSchoolDay: "2026-10-13",
    lastSchoolDay: "2026-12-18",
    days: 42,
  },
  {
    id: "q3",
    kind: "quarter",
    label: "Quarter 3",
    start: "2026-12-19",
    end: "2027-03-12",
    firstSchoolDay: "2027-01-04",
    lastSchoolDay: "2027-03-12",
    days: 48,
  },
  {
    id: "q4",
    kind: "quarter",
    label: "Quarter 4",
    start: "2027-03-13",
    end: LAST_STUDENT_DAY,
    firstSchoolDay: "2027-03-16",
    lastSchoolDay: LAST_STUDENT_DAY,
    days: 49,
  },
  {
    id: "s1",
    kind: "semester",
    label: "Semester 1",
    start: FIRST_STUDENT_DAY,
    end: "2026-12-18",
    firstSchoolDay: FIRST_STUDENT_DAY,
    lastSchoolDay: "2026-12-18",
    days: 83,
  },
  {
    id: "s2",
    kind: "semester",
    label: "Semester 2",
    start: "2026-12-19",
    end: LAST_STUDENT_DAY,
    firstSchoolDay: "2027-01-04",
    lastSchoolDay: LAST_STUDENT_DAY,
    days: 97,
  },
  {
    id: "t1",
    kind: "trimester",
    label: "Trimester 1",
    start: FIRST_STUDENT_DAY,
    end: "2026-10-30",
    firstSchoolDay: FIRST_STUDENT_DAY,
    lastSchoolDay: "2026-10-30",
    days: 55,
  },
  {
    id: "t2",
    kind: "trimester",
    label: "Trimester 2",
    start: "2026-10-31",
    end: "2027-02-26",
    firstSchoolDay: "2026-11-02",
    lastSchoolDay: "2027-02-26",
    days: 66,
  },
  {
    id: "t3",
    kind: "trimester",
    label: "Trimester 3",
    start: "2027-02-27",
    end: LAST_STUDENT_DAY,
    firstSchoolDay: "2027-03-01",
    lastSchoolDay: LAST_STUDENT_DAY,
    days: 59,
  },
];

interface Closure {
  /** Inclusive first day. */
  start: string;
  /** Inclusive last day; same as start for a single day. */
  end?: string;
  label: string;
}

/** Days inside the school year when students are not in school. */
const CLOSURES: Closure[] = [
  { start: "2026-09-07", label: "Labor Day" },
  { start: "2026-10-05", end: "2026-10-09", label: "Fall Recess" },
  { start: "2026-10-12", label: "Indigenous Peoples Day" },
  { start: "2026-10-26", label: "Teacher in-service" },
  { start: "2026-11-11", label: "Veterans Day" },
  { start: "2026-11-23", end: "2026-11-27", label: "School Recess" },
  { start: "2026-12-21", end: "2027-01-01", label: "Winter Recess" },
  { start: "2027-01-18", label: "Martin Luther King Day" },
  { start: "2027-02-15", label: "Presidents Day" },
  { start: "2027-03-15", label: "Teacher in-service" },
  { start: "2027-04-02", label: "Farmworkers Day" },
  { start: "2027-04-05", end: "2027-04-12", label: "Spring Recess" },
  { start: "2027-05-31", label: "Memorial Day" },
];

/**
 * Half days, from the bell schedule. Note April 2 also appears on the bell
 * schedule as a minimum day but the district calendar makes it a holiday, so
 * the closure wins.
 */
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

/** Dates the district calls out, shown when they land on a school day. */
const MILESTONES: Record<string, string> = {
  "2026-08-06": "First student day",
  "2026-10-02": "End of Quarter 1",
  "2026-10-30": "End of Trimester 1",
  "2026-12-18": "End of Semester 1 and Quarter 2",
  "2027-02-26": "End of Trimester 2",
  "2027-03-12": "End of Quarter 3",
  "2027-06-02": "Last student day",
};

export type DayKind =
  | "school"
  | "wednesday"
  | "minimum"
  | "weekend"
  | "closure"
  | "outsideYear";

export interface SchoolDayInfo {
  day: string;
  kind: DayKind;
  isSchoolDay: boolean;
  /** A short line for the top of the log, e.g. "Minimum day". */
  label: string;
  /** Set when the district marks the date, e.g. "End of Quarter 1". */
  milestone?: string;
}

function parseDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

export function isWeekend(day: string): boolean {
  const weekday = parseDay(day).getDay();
  return weekday === 0 || weekday === 6;
}

export function isMinimumDay(day: string): boolean {
  return MINIMUM_DAYS.includes(day) && !closureOn(day);
}

function closureOn(day: string): Closure | undefined {
  return CLOSURES.find((c) => day >= c.start && day <= (c.end ?? c.start));
}

export function describeDay(day: string): SchoolDayInfo {
  const milestone = MILESTONES[day];

  if (day < FIRST_STUDENT_DAY || day > LAST_STUDENT_DAY) {
    return {
      day,
      kind: "outsideYear",
      isSchoolDay: false,
      label: `Outside the ${SCHOOL_YEAR_LABEL} school year`,
    };
  }

  const closure = closureOn(day);
  if (closure) {
    return {
      day,
      kind: "closure",
      isSchoolDay: false,
      label: `No school — ${closure.label}`,
    };
  }

  if (isWeekend(day)) {
    return { day, kind: "weekend", isSchoolDay: false, label: "Weekend" };
  }

  if (MINIMUM_DAYS.includes(day)) {
    return {
      day,
      kind: "minimum",
      isSchoolDay: true,
      label: "Minimum day — school ends at 12:00 PM",
      milestone,
    };
  }

  if (parseDay(day).getDay() === 3) {
    return {
      day,
      kind: "wednesday",
      isSchoolDay: true,
      label: "Wednesday — early release, lunch after the final bell",
      milestone,
    };
  }

  return { day, kind: "school", isSchoolDay: true, label: "School day", milestone };
}

export function isSchoolDay(day: string): boolean {
  return describeDay(day).isSchoolDay;
}

/** The next day students are in school, for "school resumes" messaging. */
export function nextSchoolDay(day: string): string | null {
  const cursor = parseDay(day);
  for (let i = 0; i < 400; i += 1) {
    cursor.setDate(cursor.getDate() + 1);
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (key > LAST_STUDENT_DAY) return null;
    if (isSchoolDay(key)) return key;
  }
  return null;
}

export function termsOfKind(kind: TermKind): SchoolTerm[] {
  return SCHOOL_TERMS.filter((t) => t.kind === kind);
}

/** The term a day falls in, preferring the shortest matching term. */
export function termFor(day: string, kind: TermKind = "quarter"): SchoolTerm | null {
  return termsOfKind(kind).find((t) => day >= t.start && day <= t.end) ?? null;
}
