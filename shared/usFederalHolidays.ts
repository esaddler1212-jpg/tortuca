/** US federal holidays (date.run/api is public; we keep a small static cache for offline day-mode). */

export const US_FEDERAL_NO_SCHOOL_DATES = [
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Day
  "2026-02-16", // Presidents' Day
  "2026-05-25", // Memorial Day
  "2026-07-03", // Independence Day (observed)
  "2026-09-07", // Labor Day
  "2026-10-12", // Columbus Day
  "2026-11-11", // Veterans Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-05-31",
  "2027-07-05",
  "2027-09-06",
  "2027-10-11",
  "2027-11-11",
  "2027-11-25",
  "2027-12-24",
  "2027-12-31",
] as const;