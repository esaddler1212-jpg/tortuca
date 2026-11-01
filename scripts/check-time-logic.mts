/**
 * Regression checks for Alfred's time logic (wake/bedtime, weekdays vs
 * weekends, school holidays, DST, time-zone conversion).
 *
 *   npm run test:time
 *
 * Runs the checks under both UTC (like Netlify servers) and
 * America/Los_Angeles (like E's phone); results must be identical.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { computeSuggestedBedtime, nextWakeDay } from "../shared/bedtime.ts";
import { computeServerLeaveBy } from "../shared/leaveByLite.ts";
import { addDays, localHour, weekdayOfDay, zonedDateTime } from "../shared/timezone.ts";
import { DEFAULT_SETTINGS } from "../src/types.ts";

const TZ = "America/Los_Angeles";
const settings = { ...DEFAULT_SETTINGS }; // wake 04:15 weekdays, 08:00 days off, 7.5h sleep
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(d);

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n    expected ${JSON.stringify(expected)}\n    got      ${JSON.stringify(actual)}`}`);
}

// ── time-zone conversion (the original bug: early-morning times landed a day early)
check("4:15 AM on Mon Nov 2 is Mon Nov 2", fmt(zonedDateTime("2026-11-02", "04:15", TZ)), "Mon, Nov 2, 4:15 AM");
check("7:20 AM on Mon Nov 2 is Mon Nov 2", fmt(zonedDateTime("2026-11-02", "07:20", TZ)), "Mon, Nov 2, 7:20 AM");
check("DST end day 1:30 AM stays on Nov 1", fmt(zonedDateTime("2026-11-01", "01:30", TZ)).startsWith("Sun, Nov 1"), true);
check("summer (PDT) 6:00 AM", fmt(zonedDateTime("2026-07-15", "06:00", TZ)), "Wed, Jul 15, 6:00 AM");
check("addDays crosses year", addDays("2026-12-31", 1), "2027-01-01");
check("weekdayOfDay", weekdayOfDay("2026-11-07"), "Sat");
check("localHour midnight is 0, not 24", localHour(TZ, new Date("2026-11-03T08:00:00Z")), 0);

// ── bedtime plan for the next wake-up
const at = (iso: string) => computeSuggestedBedtime(settings, null, new Date(iso));
const plan = (iso: string) => {
  const p = at(iso);
  return { lightsOut: fmt(p.lightsOut), wake: fmt(p.wakeUp), windingDown: new Date(iso) >= p.windDownStart };
};
check("Sun 9 AM: not winding down; lights out tonight for Mon 4:15",
  plan("2026-11-01T17:00:00Z"), { lightsOut: "Sun, Nov 1, 8:45 PM", wake: "Mon, Nov 2, 4:15 AM", windingDown: false });
check("Mon 9 AM: NOT 'past lights-out' (the reported bug)",
  plan("2026-11-02T17:00:00Z"), { lightsOut: "Mon, Nov 2, 8:45 PM", wake: "Tue, Nov 3, 4:15 AM", windingDown: false });
check("Sun 9 PM: winding down",
  plan("2026-11-02T05:00:00Z").windingDown, true);
check("Mon 12:30 AM: still tonight's plan (Mon 4:15 wake), past lights-out",
  plan("2026-11-02T08:30:00Z"), { lightsOut: "Sun, Nov 1, 8:45 PM", wake: "Mon, Nov 2, 4:15 AM", windingDown: true });
check("Fri 10 PM: weekend wake 8 AM, lights out 12:30",
  plan("2026-11-07T06:00:00Z"), { lightsOut: "Sat, Nov 7, 12:30 AM", wake: "Sat, Nov 7, 8:00 AM", windingDown: false });
check("Tue before Veterans Day: holiday wake 8 AM",
  plan("2026-11-10T20:00:00Z").wake, "Wed, Nov 11, 8:00 AM");
check("nextWakeDay before alarm is today", nextWakeDay(settings, new Date("2026-11-02T10:00:00Z")), "2026-11-02");
check("nextWakeDay after alarm is tomorrow", nextWakeDay(settings, new Date("2026-11-02T13:00:00Z")), "2026-11-03");

// ── leave-by (server)
const leave = (day: string) => {
  const l = computeServerLeaveBy(settings, zonedDateTime(day, "12:00", TZ));
  return l ? fmt(l.leaveBy) : null;
};
check("school day leave-by", leave("2026-11-02"), "Mon, Nov 2, 7:20 AM");
check("Saturday: no leave-by", leave("2026-11-07"), null);
check("Veterans Day: no leave-by", leave("2026-11-11"), null);
check("Thanksgiving recess: no leave-by", leave("2026-11-25"), null);

// ── simulate two weeks of server reminders (reminder-check.ts logic)
const sent = new Set<string>();
const windDowns: string[] = [];
let daytimeLightsOut = 0;
for (let t = Date.parse("2026-11-01T07:00:00Z"); t < Date.parse("2026-11-15T08:00:00Z"); t += 10 * 60_000) {
  const now = new Date(t);
  const wakeDay = nextWakeDay(settings, now);
  const wl = computeServerLeaveBy(settings, zonedDateTime(wakeDay, "12:00", TZ));
  const bed = computeSuggestedBedtime(settings, wl, now);
  const ms = bed.windDownStart.getTime() - t;
  const key = `${bed.wakeDay}-winddown`;
  if (ms >= 0 && ms <= 10 * 60_000 && !sent.has(key)) { sent.add(key); windDowns.push(fmt(now)); }
  const h = localHour(TZ, now);
  if (h >= 8 && h < 18 && now >= bed.windDownStart) daytimeLightsOut++;
}
check("no 'past lights-out' during the day across two weeks", daytimeLightsOut, 0);
check("one wind-down reminder per night (15 nights incl. DST night)", windDowns.length, 15);
// Sun–Thu nights at 8:10 PM, except Tue Nov 10 (Veterans Day eve → 11:50 PM): 9 nights.
check("weeknight reminders at 8:10 PM (holiday eve moves later)", windDowns.filter((w) => w.endsWith("8:10 PM")).length, 9);
check("Veterans Day eve reminder at 11:50 PM", windDowns.includes("Tue, Nov 10, 11:50 PM"), true);

// ── same answers regardless of the machine's time zone
const self = fileURLToPath(import.meta.url);
if (!process.env.TIME_CHECK_CHILD) {
  const runIn = (tz: string) => {
    try {
      return execFileSync(process.execPath, ["--import", "tsx", self], {
        env: { ...process.env, TZ: tz, TIME_CHECK_CHILD: "1" },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      return `FAILED in ${tz}: ${(e as { stdout?: string }).stdout ?? ""}`;
    }
  };
  const utc = runIn("UTC");
  const la = runIn("America/Los_Angeles");
  check("identical results in UTC and America/Los_Angeles", utc === la, true);
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
if (!process.env.TIME_CHECK_CHILD) console.log("\nAll time-logic checks passed.");
