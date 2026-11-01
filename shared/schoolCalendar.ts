/** School calendar shared by the app and Netlify functions. */

/** No-school days (from E's school calendar). Calendar events saying
 *  "no school", "recess", or "holiday" on a day are honored too. */
export const NO_SCHOOL_DAYS = new Set<string>([
  "2026-11-11", // Veterans Day
  "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", // Thanksgiving recess
  "2026-12-23", "2026-12-24", "2026-12-25", "2026-12-28", "2026-12-29", "2026-12-30",
  "2026-12-31", "2027-01-01", // Winter recess (through Jan 2)
]);

const NO_SCHOOL_WORDS = ["no school", "recess", "holiday", "school closed", "non-student"];

export function isNoSchoolLabel(text: string): boolean {
  const t = text.toLowerCase();
  return NO_SCHOOL_WORDS.some((w) => t.includes(w));
}

/** Minimum days: school ends at noon. */
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

/** Local dismissal time (HH:MM) for a school day: noon on minimum days, 12:43 Wednesdays, else 2:18. */
export function dismissalTime(day: string, weekday: string): string {
  if (MINIMUM_DAYS.includes(day)) return "12:00";
  if (weekday === "Wed") return "12:43";
  return "14:18";
}
