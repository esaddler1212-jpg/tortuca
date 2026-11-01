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
