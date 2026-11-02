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
import { applyDayMode, dayMode } from "../shared/dayMode.ts";
import * as Plan from "../shared/plan.ts";
import * as Sparks from "../shared/sparks.ts";
import * as Hub from "../shared/hub.ts";
import * as Pulse from "../shared/pulse.ts";
import { buildAskContext } from "../src/lib/askContext.ts";

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

// ── focus modes: school (Family Purpose) → ECS Network → weekend Vantage briefing
const mode = (iso: string) => dayMode(TZ, new Date(iso));
check("Mon 5:30 AM: before school focus → network", mode("2026-11-02T13:30:00Z"), "network");
check("Mon 8:00 AM: school (Family Purpose)", mode("2026-11-02T16:00:00Z"), "school");
check("Mon 2:17 PM: still school", mode("2026-11-02T22:17:00Z"), "school");
check("Mon 2:18 PM dismissal: ECS Network", mode("2026-11-02T22:18:00Z"), "network");
check("Wed 12:45 PM (early release): ECS Network", mode("2026-11-04T20:45:00Z"), "network");
check("Tue Dec 1 12:30 PM (minimum day): ECS Network", mode("2026-12-01T20:30:00Z"), "network");
check("Fri 9 PM: ECS Network", mode("2026-11-07T05:00:00Z"), "network");
check("Saturday: weekend (Vantage)", mode("2026-11-07T18:00:00Z"), "weekend");
check("Veterans Day: holiday (Vantage)", mode("2026-11-11T18:00:00Z"), "holiday");
const feed = {
  nodes: [
    { nodeType: "education", snapshot: { summary: "FP", priorityActions: ["Follow up with a student"],
      calendar: [{ kind: "follow_up_due", title: "Follow-up" }, { kind: "group_meeting", title: "BOYS group" }] } },
    { nodeType: "commerce", snapshot: { summary: "Store", priorityActions: ["Approve 2 orders"], calendar: [] } },
    { nodeType: "ops", snapshot: { summary: "Roadmap", priorityActions: ["Lock $BAY legal"],
      calendar: [{ kind: "milestone", title: "$BAY legal" }] } },
  ],
  priorityActions: [], calendar: [],
};
const actions = (m: Parameters<typeof applyDayMode>[1]) => applyDayMode(feed as never, m)!.priorityActions;
const events = (m: Parameters<typeof applyDayMode>[1]) => (applyDayMode(feed as never, m)! as typeof feed).calendar.map((c) => c.title);
check("school: only Family Purpose tasks", actions("school"), ["Follow up with a student"]);
check("network: ECS tasks, no Family Purpose", actions("network"), ["Approve 2 orders", "Lock $BAY legal"]);
check("weekend: big picture only (roadmap)", actions("weekend"), ["Lock $BAY legal"]);
check("events kept in every mode", events("network"), ["BOYS group", "$BAY legal"]);

// ── plan: focus, overdue, countdown, daily spark
const plan0 = { ...Plan.EMPTY_PLAN };
check("plan: school hours keep ECS tasks off Do today", Plan.weekFocus(plan0, "2026-11-02", "school").length, 0);
check("plan: ECS afternoon starts with the $BAY budget", Plan.weekFocus(plan0, "2026-11-02", "network", 1)[0]?.id, "bay-budget");
check("plan: December shows November's open tasks first (overdue)", Plan.weekFocus(plan0, "2026-12-02", "network", 1)[0]?.month, "2026-11");
check("plan: 59 days left on Nov 2", Plan.daysLeftInYear("2026-11-02"), 59);
const done1 = { ...plan0, done: { "bay-budget": "2026-11-02T20:00:00Z" } };
check("plan: crossing off counts toward the goal", Plan.goalProgress(done1, "g26-bay-lock"), { done: 3, total: 12 });
const sp = { ...plan0, sparkLog: { "2026-10-31": { done: "x" }, "2026-11-01": { done: "x" }, "2026-11-02": { shuffle: 1 } } };
check("spark: week (Mon–Sun) counts Sunday's spark", Plan.sparkWeek(sp, "2026-11-01").done, 2);
check("spark: new week starts at 0 on Monday", Plan.sparkWeek(sp, "2026-11-02").done, 0);
check("spark: streak keeps going while today is open", Plan.sparkStreak(sp, "2026-11-02"), 2);
check("spark: same day, same spark", Sparks.sparkFor("2026-11-02").prompt, Sparks.sparkFor("2026-11-02").prompt);
check("spark: Monday is a music day", Sparks.sparkFor("2026-11-02").theme, "music");
check("spark: Another one changes the prompt", Plan.todaySpark(sp, "2026-11-02").prompt !== Sparks.sparkFor("2026-11-02").prompt, true);
check("spark: Sunday is reflection", Sparks.sparkFor("2026-11-01").theme, "reflect");

// ── agent desk + AI budget
const desk = { ...plan0, handoffs: { "bay-budget": { status: "review", at: "x" }, "bay-trademark": { status: "working", at: "x" } } } as typeof plan0;
const q = Plan.handoffQueue(desk);
check("desk: review and working queues", [q.review.map((t) => t.id), q.working.length], [["bay-budget"], Plan.allTasks(plan0).some((t) => t.id === "bay-trademark") ? 1 : 0]);
check("desk: approved tasks leave the desk", Plan.handoffQueue({ ...desk, done: { "bay-budget": "x" } }).review.length, 0);
check("desk: 'you' tasks can't be handed off", Plan.allTasks(plan0).filter((t) => t.ai === "you").every((t) => !Plan.canHandOff(t)), true);
check("budget: total of line items", Plan.budgetTotal({ monthly: 50, items: [{ id: "a", name: "Claude", amount: 20 }, { id: "b", name: "Fish", amount: 11 }] }), 31);

// ── hub: feed, watchers, gym, money, memos
const rss = `<rss><channel><item><title><![CDATA[Bay &amp; film]]></title><link>https://a.com/1</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
const atom = `<feed><entry><title>New video</title><link rel="alternate" href="https://youtube.com/watch?v=x"/><published>2026-11-01T00:00:00Z</published></entry></feed>`;
check("feed: parses RSS (CDATA, entities)", Hub.parseFeed(rss, "A")[0], { title: "Bay & film", link: "https://a.com/1", published: "Mon, 02 Nov 2026 10:00:00 GMT", source: "A" });
check("feed: parses Atom/YouTube links", Hub.parseFeed(atom, "YT")[0]?.link, "https://youtube.com/watch?v=x");
check("feed: blocks private/IP URLs", ["http://localhost/x", "http://169.254.169.254/", "file:///etc", "https://ok.example.com/feed"].map(Hub.isSafePublicUrl), [false, false, false, true]);
const w = { id: "w", name: "Grants", url: "https://x.org" };
check("watch: first check sets a baseline, no alert", Hub.evaluateCheck(w, undefined, "a", "h1", "t").alert, null);
check("watch: changed hash alerts", Hub.evaluateCheck(w, { hash: "h1", checkedAt: "t" }, "b", "h2", "t2").alert, "Grants changed");
const wl = { ...w, lookFor: "Now Open" };
check("watch: lookFor alerts only when text appears", [Hub.evaluateCheck(wl, undefined, "applications now open", "h", "t").alert, Hub.evaluateCheck(wl, { found: false, checkedAt: "t" }, "applications now open", "h", "t").alert], [null, '"Now Open" is now on Grants']);
check("gym: Tue is arms & chest", Hub.gymDayFor(Hub.DEFAULT_ROUTINE, "2026-11-03")?.plan.title, "Arms & chest");
check("gym: Monday points to Tuesday", [Hub.gymDayFor(Hub.DEFAULT_ROUTINE, "2026-11-02")?.day, Hub.gymDayFor(Hub.DEFAULT_ROUTINE, "2026-11-02")?.isToday], ["2026-11-03", false]);
check("gym: last weight from earlier sessions", Hub.lastWeight({ "2026-10-27": { bench: { weight: 135 } }, "2026-11-03": { bench: { weight: 145 } } }, "bench", "2026-11-03"), 135);
const m = Hub.moneyMonth([
  { id: "1", date: "2026-11-02", kind: "in", amount: 400, category: "Easy Supply" },
  { id: "2", date: "2026-11-02", kind: "in", amount: 1000, category: "Personal" },
  { id: "3", date: "2026-11-03", kind: "out", amount: 60, category: "Food" },
  { id: "4", date: "2026-10-30", kind: "out", amount: 999, category: "Bills" },
], "2026-11");
check("money: month totals and ECS revenue", [m.income, m.spent, m.net, m.ecsRevenue], [1400, 60, 1340, 400]);
check("memos: pulls to-dos out of speech", Hub.extractTodos("Okay so I need to call Mike about the shoot. The beat is fire. Remember to send the deck to KQED and then email the principal"), ["Call Mike about the shoot", "Send the deck to KQED", "Email the principal"]);

// ── Bay Area Pulse (Vallejo 38.1041, -122.2566)
const V = [38.1041, -122.2566] as const;
check("pulse: Vallejo → SF is ~24 mi", Math.round(Pulse.milesBetween(V[0], V[1], 37.7749, -122.4194)), 24);
const usgs = { features: [{ id: "nc1", properties: { mag: 3.42, place: "4 km NE of American Canyon, CA", time: Date.parse("2026-11-02T20:00:00Z"), url: "https://e/1" }, geometry: { coordinates: [-122.23, 38.2, 8] } }] };
const qs = Pulse.parseQuakes(usgs, V[0], V[1]);
check("pulse: parses USGS quakes with distance", [qs[0].mag, qs[0].miles], [3.4, 7]);
check("pulse: AQI bands", [Pulse.aqiLevel(42).level, Pulse.aqiLevel(120).level, Pulse.aqiLevel(160).level], ["good", "sensitive", "unhealthy"]);
check("pulse: parses Open-Meteo air", Pulse.parseAir({ current: { us_aqi: 57.4, pm2_5: 12.34 } }), { aqi: 57, pm25: 12.3, label: "Moderate", level: "moderate" });
const fires = Pulse.parseFires({ features: [
  { attributes: { IncidentName: "Lake", IncidentSize: 1200.4, PercentContained: 10, IncidentTypeCategory: "WF", UniqueFireIdentifier: "2026-CA-1" }, geometry: { x: -122.3, y: 38.4 } },
  { attributes: { IncidentName: "Pile Burn", IncidentTypeCategory: "RX" }, geometry: { x: -122.2, y: 38.1 } },
] }, V[0], V[1]);
check("pulse: wildfires only, named, with miles", fires.map((f) => [f.name, f.miles, f.acres]), [["Lake Fire", 21, 1200]]);
const cams = Pulse.parseCams({ data: [
  { cctv: { inService: "true", location: { latitude: 38.11, longitude: -122.25, locationName: "TV999 -- I-80 : Magazine St", route: "I-80" }, imageData: { static: { currentImageURL: "https://cwwp2.dot.ca.gov/data/d4/cctv/image/a.jpg" } } } },
  { cctv: { inService: "false", location: { latitude: 38.11, longitude: -122.25, route: "I-80" }, imageData: { static: { currentImageURL: "https://cwwp2.dot.ca.gov/x.jpg" } } } },
  { cctv: { inService: "true", location: { latitude: 37.3, longitude: -121.9, route: "I-280" }, imageData: { static: { currentImageURL: "https://cwwp2.dot.ca.gov/y.jpg" } } } },
] }, V[0], V[1]);
check("pulse: only in-service commute cams nearby", cams.map((c) => [c.route, c.name]), [["I-80", "Magazine St"]]);
const fl = Pulse.parseFlights({ ac: [{ hex: "a1", flight: "UAL123 ", t: "B738", alt_baro: 5000, lat: 38.12, lon: -122.26 }, { hex: "a2", alt_baro: "ground", lat: 38.1, lon: -122.25 }] }, V[0], V[1]);
check("pulse: airborne flights only, trimmed callsign", [fl.count, fl.nearest[0].callsign, fl.nearest[0].altitudeFt], [1, "UAL123", 5000]);
const snap = { fetchedAt: "", quakes: qs, alerts: Pulse.parseWeatherAlerts({ features: [{ properties: { id: "nws1", event: "Red Flag Warning", severity: "Severe", headline: "Red Flag Warning until 8 PM" } }] }), air: Pulse.parseAir({ current: { us_aqi: 165 } }), fires, cams, flights: fl, unavailable: [] };
check("pulse: alerts for near quake, fire, red flag, bad air", Pulse.pulseAlerts(snap, new Date("2026-11-02T20:30:00Z"), "2026-11-02").map((a) => a.id), ["q:nc1", "f:2026-CA-1", "w:nws1", "a:2026-11-02"]);
check("pulse: old quake doesn't alert", Pulse.pulseAlerts({ ...snap, fires: [], alerts: [], air: null }, new Date("2026-11-03T20:30:00Z"), "d").length, 0);
check("pulse: summary line", Pulse.pulseSummary({ ...snap, air: Pulse.parseAir({ current: { us_aqi: 40 } }) }), "Red Flag Warning · AQI 40 good · Lake Fire 21 mi · M3.4 quake 7 mi");

// ── conversation context: Family Purpose details never leave the device
const ctx = buildAskContext({
  now: new Date("2026-11-02T23:30:00Z"), timeZone: "America/Los_Angeles", modeLabel: "ECS Network", city: "Vallejo",
  actions: [
    { id: "1", title: "Check in with Marcus about attendance", source: "follow-up", sourceLabel: "Family Purpose", urgent: true, sort: 0 },
    { id: "2", title: "Lock $BAY legal", source: "plan", sourceLabel: "Plan · Tortuga", urgent: false, sort: 1 },
  ],
  events: [
    { id: "e1", title: "Session with Jaylen", start: "2026-11-03T16:00:00Z", source: "family-purpose" },
    { id: "e2", title: "Sponsor call", start: "2026-11-03T20:00:00Z", source: "google" },
  ],
});
check("ask: student names withheld from Alfred's context", [/Marcus|Jaylen/.test(ctx), /Lock \$BAY legal/.test(ctx), /Sponsor call/.test(ctx), /1 Family Purpose item \(student/.test(ctx)], [false, true, true, true]);
check("ask: knows the local time and day", /Monday, November 2 at 3:30/.test(ctx), true);

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
