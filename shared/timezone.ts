/** Timezone helpers shared between client and Netlify functions. */

export function zonedDateTime(day: string, hhmm: string, timeZone: string): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  let guess = new Date(
    `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`,
  );
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const y = get("year");
    const mo = get("month");
    const da = get("day");
    const h = get("hour");
    const mi = get("minute");
    const gotDay = `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
    if (gotDay === day && h === hour && mi === minute) return guess;
    guess = new Date(guess.getTime() + ((hour - h) * 60 + (minute - mi)) * 60_000);
  }
  return guess;
}

export function dayKey(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function isWeekend(date: Date, timeZone: string): boolean {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return wd === "Sat" || wd === "Sun";
}
