/** Timezone helpers shared between client and Netlify functions. */

/** Milliseconds the zone is ahead of UTC at `date` (e.g. -8h for PST). */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * The instant when the wall clock in `timeZone` reads `hhmm` on calendar day
 * `day` (YYYY-MM-DD). DST-safe: re-checks the offset at the result, so days
 * when clocks change still land on the right local time.
 */
export function zonedDateTime(day: string, hhmm: string, timeZone: string): Date {
  const [y, mo, d] = day.split("-").map(Number);
  const [hour, minute] = hhmm.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, hour, minute);
  const firstOffset = zoneOffsetMs(new Date(wallAsUtc), timeZone);
  let result = wallAsUtc - firstOffset;
  const secondOffset = zoneOffsetMs(new Date(result), timeZone);
  if (secondOffset !== firstOffset) result = wallAsUtc - secondOffset;
  return new Date(result);
}

/** Calendar day `n` days after `day` (YYYY-MM-DD), independent of any clock. */
export function addDays(day: string, n: number): string {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
}

/** Weekday name ("Mon"…"Sun") of a YYYY-MM-DD calendar day. */
export function weekdayOfDay(day: string): string {
  const [y, mo, d] = day.split("-").map(Number);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
}

export function dayKey(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function isWeekendDay(day: string): boolean {
  const wd = weekdayOfDay(day);
  return wd === "Sat" || wd === "Sun";
}

export function isWeekend(date: Date, timeZone: string): boolean {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return wd === "Sat" || wd === "Sun";
}

/** Local hour 0–23 in `timeZone` (never "24" at midnight, unlike hour12:false). */
export function localHour(timeZone: string, date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(date),
  );
}
