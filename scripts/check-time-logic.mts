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
import { addDays, clockTime, localHour, weekdayOfDay, zonedDateTime } from "../shared/timezone.ts";
import { DEFAULT_SETTINGS } from "../src/types.ts";
import { applyDayMode, dayMode } from "../shared/dayMode.ts";
import * as Plan from "../shared/plan.ts";
import * as Sparks from "../shared/sparks.ts";
import * as Hub from "../shared/hub.ts";
import * as Usage from "../shared/irisUsage.ts";
import { matchModuleFromSpeech, HUD_TABS, HUD_MORE, HUD_MODULE_IDS } from "../shared/hudModules.ts";
import { IRIS_TEAM, teamCoverageOk } from "../shared/irisTeam.ts";
import { teamEfficiencySummary, findDuplicateDelegate, duplicateBlockedMessage, type IrisDelegateLog } from "../shared/irisTeamActivity.ts";
import { hudGauges } from "../shared/hudGauges.ts";
import { commuteMinutesFor, inCommuteWindow } from "../shared/commute.ts";
import * as IC from "../shared/irisContext.ts";
import * as Pulse from "../shared/pulse.ts";
import { normalizeGodsEyeUrl } from "../shared/godsEye.ts";
import * as Sky from "../shared/sky.ts";
import * as Fl from "../shared/flight.ts";
import { parseAisMessages } from "../shared/ships.ts";
import { buildAskContext } from "../src/lib/askContext.ts";
import * as Ex from "../shared/exercises.ts";
import { buildFamilyPurposeWoodhouseNode } from "../netlify/functions/_family-purpose-woodhouse.ts";
import { mergeBackups } from "../netlify/functions/_fp-backup.ts";
import * as Voices from "../shared/irisVoices.ts";
import { readFileSync } from "node:fs";

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
check("god's eye: host:port gets http", normalizeGodsEyeUrl("localhost:4173"), "http://localhost:4173");
check("god's eye: LAN IP", normalizeGodsEyeUrl(" 192.168.1.20:4173 "), "http://192.168.1.20:4173");
check("god's eye: full https kept", normalizeGodsEyeUrl("https://globe.example.lan/"), "https://globe.example.lan");
check("god's eye: rejects javascript:", normalizeGodsEyeUrl("javascript:alert(1)"), null);
check("god's eye: rejects credentials", normalizeGodsEyeUrl("http://user:pw@localhost:4173"), null);
check("god's eye: empty is null", normalizeGodsEyeUrl("  "), null);
check("pulse: flights carry map position + heading", [fl.nearest[0].lat, fl.nearest[0].lon, fl.all.length], [38.12, -122.26, 1]);
check("pulse: quakes/fires/cams carry map position", [qs[0].lat, fires[0].lon, cams[0].lat], [38.2, -122.3, 38.11]);

// ── ISS passes (sample TLE from June 2019, checked against that week)
const ISS1 = "1 25544U 98067A   19156.50900463  .00003075  00000-0  59442-4 0  9992";
const ISS2 = "2 25544  51.6433  59.2583 0008217  16.4489 347.6017 15.51174618173442";
const passes = Sky.issPasses(ISS1, ISS2, V[0], V[1], new Date("2019-06-05T12:00:00Z"), 48);
check("sky: finds several ISS passes in 2 days", passes.length >= 4 && passes.length <= 14, true);
check("sky: passes last 2–12 minutes", passes.every((p) => { const m = (Date.parse(p.end) - Date.parse(p.start)) / 60000; return m >= 1 && m <= 12; }), true);
check("sky: peak inside pass, elevation sane", passes.every((p) => p.start <= p.peak && p.peak <= p.end && p.maxElevation >= 10 && p.maxElevation <= 90), true);
check("sky: some passes visible (June evenings), not all", passes.some((p) => p.visible) && passes.some((p) => !p.visible), true);
check("sky: visible passes are at dusk/dawn locally", passes.filter((p) => p.visible).every((p) => { const h = Number(new Date(p.start).toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Los_Angeles" })); return h >= 20 || h <= 5; }), true);
check("sky: compass", [Sky.compass(0), Sky.compass(44), Sky.compass(315), Sky.compass(359)], ["N", "NE", "NW", "N"]);
check("sky: describe tonight", Sky.describePass({ start: "2026-11-04T02:42:00Z", peak: "", end: "", maxElevation: 54, from: "NW", peakDir: "N", to: "SE", visible: true, visibleMinutes: 5 }, "America/Los_Angeles", new Date("2026-11-03T20:00:00Z")), "Tonight 6:42 PM, NW to SE, 54° high, about 5 min");

// ── Flight tracking
check("flight: callsigns from speech", ["UA 123", "ua123", "United 123", "flight DL 45", "UAL123", "N123AB", "B6 615", "hello", "XX 12"].map(Fl.toCallsign), ["UAL123", "UAL123", "UAL123", "DAL45", "UAL123", "N123AB", "JBU615", null, null]);
const fix = Fl.parseCallsignResponse({ ac: [
  { hex: "old", flight: "UAL123  ", lat: 1, lon: 1, seen_pos: 400 },
  { hex: "a1b2c3", flight: "UAL123  ", t: "B39M", r: "N37502", lat: 39.5, lon: -119.8, alt_baro: 36000, gs: 450, track: 250, baro_rate: 0, seen_pos: 2 },
] }, "UAL123");
check("flight: freshest fix wins", [fix?.hex, fix?.airline, fix?.altitudeFt, fix?.speedKt], ["a1b2c3", "United", 36000, 450]);
const route = Fl.parseRoute([{ callsign: "UAL123", plausible: 1, _airports: [
  { iata: "ORD", name: "Chicago O'Hare", location: "Chicago", lat: 41.98, lon: -87.9 },
  { iata: "SFO", name: "San Francisco Intl", location: "San Francisco", lat: 37.62, lon: -122.38 },
] }]);
check("flight: route origin → destination", [route.origin?.code, route.destination?.code], ["ORD", "SFO"]);
check("flight: implausible route ignored", Fl.parseRoute([{ plausible: 0, _airports: [{ iata: "A" }, { iata: "B" }] }]), {});
const eta = Fl.withEta(fix!, route, new Date("2026-11-03T20:00:00Z"));
check("flight: miles to go + ETA from speed", [eta.milesToGo, eta.eta?.slice(0, 16)], [191, "2026-11-03T20:32"]);
check("flight: spoken answer", Fl.describeFlight(eta, "America/Los_Angeles", V[0], V[1]), "United 123 from Chicago to San Francisco is at 36000 feet, 518 mph, about 164 miles from you. Estimated landing around 12:32 PM, 191 miles to go.");
check("flight: on the ground", Fl.describeFlight({ ...eta, onGround: true }, "America/Los_Angeles"), "United 123 from Chicago to San Francisco is on the ground right now.");

// ── Ships (AISStream)
const ships = parseAisMessages([
  { MessageType: "PositionReport", MetaData: { MMSI: 1, ShipName: "MSC ANNA@@@" }, Message: { PositionReport: { Latitude: 37.81, Longitude: -122.36, Sog: 12.3, Cog: 270.4, NavigationalStatus: 0 } } },
  { MessageType: "PositionReport", MetaData: { MMSI: 1, ShipName: "MSC ANNA" }, Message: { PositionReport: { Latitude: 37.80, Longitude: -122.40, Sog: 12.5, Cog: 271, NavigationalStatus: 0 } } },
  { MessageType: "PositionReport", MetaData: { MMSI: 2, ShipName: "" }, Message: { PositionReport: { Latitude: 38.06, Longitude: -122.25, Sog: 0, Cog: 360, NavigationalStatus: 5 } } },
  { MessageType: "ShipStaticData", MetaData: { MMSI: 2 }, Message: { ShipStaticData: { Name: "VALLEJO", Type: 60, Destination: "SF FERRY BLDG" } } },
  { MessageType: "ShipStaticData", MetaData: { MMSI: 1 }, Message: { ShipStaticData: { Type: 71 } } },
  { MessageType: "PositionReport", MetaData: { MMSI: 3 }, Message: { PositionReport: { Latitude: 91, Longitude: 0 } } },
]);
check("ships: one per vessel, latest position, moving first", ships.map((x) => [x.name, x.lon, x.speedKt, x.status, x.kind]), [["MSC ANNA", -122.4, 12.5, "underway", "Cargo"], ["VALLEJO", -122.25, 0, "moored", "Passenger"]]);
check("ships: unknown course dropped", ships[1].course, undefined);

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

// ── gym: exercise library, swaps, search
const lib = JSON.parse(readFileSync(new URL("../public/exercises.json", import.meta.url), "utf8")) as Ex.LibExercise[];
const byId = new Map(lib.map((x) => [x.id, x]));
check("gym: library has 1,324 exercises with steps", [lib.length, lib.every((x) => x.n && x.t)], [1324, true]);
check("gym: every routine exercise links to the library", Hub.DEFAULT_ROUTINE.flatMap((d) => d.exercises).every((e) => e.libId && byId.has(e.libId)), true);
const bench = byId.get("0025")!;
const swaps = Ex.swapCandidates(lib, bench, new Set<Ex.EquipmentGroup>(["Dumbbell"]));
check("gym: bench swap → dumbbell chest moves only", [swaps.length > 3, swaps.every((x) => x.t === "pectorals" && Ex.equipmentGroup(x.eq) === "Dumbbell")], [true, true]);
check("gym: swaps skip camera-angle duplicates", Ex.swapCandidates(lib, byId.get("0043")!, null, 50).some((x) => /pov\)/.test(x.n)), false);
check("gym: bench → dumbbell bench press first", swaps[0]?.n, "dumbbell bench press");
check("gym: partial search still finds something", Ex.searchExercises(lib, "face pull").length > 0, true);
check("gym: closest name ranks first", Ex.searchExercises(lib, "dumbbell shoulder press")[0]?.n, "dumbbell seated shoulder press");
check("gym: exact phrase wins", Ex.searchExercises(lib, "walking lunge")[0]?.n, "walking lunge");
check("gym: search finds walking lunge", Ex.searchExercises(lib, "walking lunge")[0]?.n, "walking lunge");
check("gym: equipment groups", ["body weight", "ez barbell", "leverage machine", "resistance band"].map(Ex.equipmentGroup), ["Bodyweight", "Barbell", "Machine", "Bands"]);

// ── Family Purpose → IRIS: counts and times only, never student details
const fpBackup = {
  settings: { schoolName: "Oak Grove Middle School", groupName: "BOYS Group" },
  checkIns: [
    { id: "c1", studentName: "Jaylen Ortiz", grade: "7", classPeriod: "P3", reasons: ["Attendance", "Family"], createdAt: "2026-11-03T16:00:00Z", followUp: { dueAt: "2026-11-03T21:00:00Z", notes: "call home" } },
    { id: "c2", studentName: "Marcus Lee", grade: "8", classPeriod: "P5", reasons: ["Conflict"], createdAt: "2026-11-01T18:00:00Z", followUp: { dueAt: "2026-11-02T18:00:00Z", notes: "check in" } },
  ],
  groupSessions: [{ id: "g1", date: "2026-11-03", topic: "Anger and family stress", notes: "x", attendees: ["Marcus Lee", "Jaylen Ortiz"], updatedAt: "2026-11-03T19:00:00Z" }],
};
const fpNode = buildFamilyPurposeWoodhouseNode(fpBackup as any, new Date("2026-11-03T18:00:00Z"), "America/Los_Angeles");
const fpText = JSON.stringify(fpNode);
check("FP→IRIS: no names, reasons, notes or group topic", /Jaylen|Ortiz|Marcus|Lee"|Attendance|Family"|Conflict|call home|Anger/.test(fpText), false);
check("FP→IRIS: counts still right", [fpNode.stats.checkInsToday, fpNode.stats.followUpsDueToday, fpNode.stats.followUpsOverdue, fpNode.stats.groupMeetingsToday], [1, 1, 1, 1]);
check("FP→IRIS: follow-ups keep their times", fpNode.calendar.filter((c) => c.kind.startsWith("follow_up")).map((c) => [c.title, c.start]), [["Student follow-up (overdue)", "2026-11-02T18:00:00Z"], ["Student follow-up", "2026-11-03T21:00:00Z"]]);
const devA = { format: "family-purpose-checkins", version: 2, exportedAt: "2026-11-03T10:00:00Z", settings: {}, checkIns: [{ id: "c1", createdAt: "1" }], groupMembers: [], groupSessions: [], studentNotes: [{ id: "n1", updatedAt: "2026-11-01", text: "a" }] };
const devB = { ...devA, exportedAt: "2026-11-03T11:00:00Z", checkIns: [{ id: "c2", createdAt: "2" }], studentNotes: [{ id: "n1", updatedAt: "2026-11-02", text: "a2" }, { id: "n2", updatedAt: "2026-11-02", text: "b" }] };
const mergedFp = mergeBackups(devA as any, devB as any);
check("FP sync: merges check-ins and notes from both devices (newest note wins)", [mergedFp.checkIns.map((c) => c.id), mergedFp.studentNotes?.map((n) => `${n.id}:${n.text}`)], [["c1", "c2"], ["n1:a2", "n2:b"]]);

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

// ── Uptime watchers (Uptime Kuma idea)
{
  const w = { id: "u1", name: "ECS site", url: "https://example.com", uptime: true };
  const t = (m: number) => new Date(Date.parse("2026-11-04T12:00:00Z") + m * 60_000).toISOString();
  const a = Hub.evaluateUptime(w, undefined, { status: 200, ms: 210 }, t(0));
  check("uptime: first check up, no alert", [a.result.up, a.alert, a.result.history], [true, null, ["u"]]);
  const b = Hub.evaluateUptime(w, a.result, { status: 503, ms: 90 }, t(10));
  check("uptime: one failure is a blip (no alert yet)", [b.result.up, b.alert, b.result.fails], [true, null, 1]);
  const c = Hub.evaluateUptime(w, b.result, { error: "timed out", ms: 10000 }, t(20));
  check("uptime: two in a row → down alert", [c.result.up, c.alert, c.result.downSince], [false, "🔴 ECS site is down (timed out)", t(10)]);
  const d = Hub.evaluateUptime(w, c.result, { status: 500 }, t(30));
  check("uptime: still down, no repeat alert", [d.result.up, d.alert], [false, null]);
  const e = Hub.evaluateUptime(w, d.result, { status: 200, ms: 180 }, t(55));
  check("uptime: back up with how long", [e.result.up, e.alert, e.result.fails, e.result.downSince], [true, "🟢 ECS site is back up (down 45 min)", 0, undefined]);
  check("uptime: login wall counts as up", [Hub.isUpStatus(401), Hub.isUpStatus(403), Hub.isUpStatus(404), Hub.isUpStatus(301)], [true, true, false, true]);
  check("uptime: percent from history", Hub.uptimePercent(e.result.history), 40);
  check("uptime: durations", [Hub.durationText(30_000), Hub.durationText(90 * 60_000), Hub.durationText(120 * 60_000)], ["1 min", "1 h 30 min", "2 h"]);
  let h: ReturnType<typeof Hub.evaluateUptime>["result"] | undefined;
  for (let i = 0; i < 200; i++) h = Hub.evaluateUptime(w, h, { status: 200 }, t(i * 10)).result;
  check("uptime: keeps 24 h of checks", h!.history!.length, 144);
}

// ── Iris usage log (Langfuse idea)
{
  const base = { at: "2026-11-04T18:00:00Z", ms: 2000, model: "claude-opus-5-5", inTok: 1000, outTok: 200, cacheRead: 9000, cacheWrite: 0, searches: 1, fetches: 0, tools: [], hops: 1, outcome: "ok" as const };
  check("usage: cost = tokens + searches", Math.round(Usage.traceCost(base) * 100000) / 100000, 0.0198);
  let log = Usage.emptyMonth("2026-11");
  log = Usage.addTrace(log, base, "2026-11-03");
  log = Usage.addTrace(log, { ...base, ms: 6000, tools: ["track_flight"], searches: 0 }, "2026-11-04");
  log = Usage.addTrace(log, { ...base, ms: 30000, inTok: 0, outTok: 0, cacheRead: 0, searches: 0, outcome: "timeout" }, "2026-11-04");
  log = Usage.addTrace(log, { ...base, model: "claude-opus-5", searches: 0 }, "2026-11-04");
  const sum = Usage.summarize(log, "2026-11-04");
  check("usage: counts, today, errors", [sum.calls, sum.today, sum.errors], [4, 3, 1]);
  check("usage: cache hit share (27k of 30k input from cache)", sum.cacheHit, 90);
  check("usage: projects the month from the pace so far", Math.abs(sum.projected - (sum.cost / 4) * 30) < 0.05, true);
  check("usage: tools and fallbacks counted", [sum.tools.track_flight, sum.fallbacks], [1, 1]);
  check("usage: recent newest first", sum.recent[0].model, "claude-opus-5");
  let big = Usage.emptyMonth("2026-11");
  for (let i = 0; i < 260; i++) big = Usage.addTrace(big, base, "2026-11-04");
  check("usage: keeps 200 traces but full day totals", [big.traces.length, big.days["2026-11-04"].calls], [200, 260]);
}

// ── Voice → module routing
check(
  "modules: inbox, drafts, vitals (Pulse), team, and today by voice",
  ["open my inbox", "show my email", "any unread mail", "draft an email to the sponsor", "show the map", "where are the planes", "earthquakes near me", "open today", "show my schedule", "open the team"].map(matchModuleFromSpeech),
  ["inbox", "inbox", "inbox", "channels", "vitals", "vitals", "vitals", "today", "today", "team"],
);

// ── HUD gauges and tabs
{
  const base = { todosPending: 3, todosDone: 1, urgent: 0, unread: 0, temp: 61.6, aqi: 38, pulseUrgent: false, workouts: 2, workoutTarget: 3, monthDone: 2, monthTotal: 7, monthLabel: "NOV" };
  const g = Object.fromEntries(hudGauges(base).map((x) => [x.id, x]));
  check("hud: today fills as the list gets done", [g.today.value, g.today.fill, g.today.alert], ["3 TASKS", 0.25, false]);
  check("hud: inbox clear vs unread (amber)", [g.inbox.value, hudGauges({ ...base, unread: 4 })[1].value, hudGauges({ ...base, unread: 4 })[1].alert, hudGauges({ ...base, unread: 40 })[1].fill], ["CLEAR", "4 NEW", true, 1]);
  check("hud: vitals shows weather + workouts, amber on Pulse alert", [g.vitals.value, Math.round(g.vitals.fill * 100), hudGauges({ ...base, pulseUrgent: true })[2].caption], ["62° · AQI 38", 67, "VITALS · PULSE ALERT"]);
  check("hud: no weather yet", hudGauges({ ...base, temp: undefined, aqi: undefined })[2].value, "--°");
  check("hud: plan month progress", [g.plan.value, Math.round(g.plan.fill * 100)], ["NOV · 2/7", 29]);
  check("hud: empty list reads all clear, urgent shows in caption", [hudGauges({ ...base, todosPending: 0, todosDone: 0 })[0].value, hudGauges({ ...base, urgent: 2 })[0].caption], ["ALL CLEAR", "TODAY · 2 URGENT"]);
  check("hud: 4 tabs + everything else under More, no module lost", [HUD_TABS.join(","), [...HUD_TABS, ...HUD_MORE].length], ["today,vitals,inbox,plan", 11]);
  check("hud: team module by voice", matchModuleFromSpeech("open the team"), "team");
  check("hud: every module id is unique", new Set(HUD_MODULE_IDS).size, HUD_MODULE_IDS.length);
  check("iris team: eleven specialists, one per module", [IRIS_TEAM.length, teamCoverageOk()], [11, true]);
  check("iris team: woodhouse owns team module", IRIS_TEAM.find((s) => s.id === "woodhouse")?.module, "team");
  {
    const hist: IrisDelegateLog[] = [
      { specialist: "scout", at: new Date().toISOString(), task: "brief on Bay Area doc sponsors", report: "Prior scout brief summary." },
      { specialist: "scout", at: new Date(Date.now() - 3600_000).toISOString(), task: "research Bay Area documentary sponsors" },
    ];
    check("woodhouse: flags similar duplicate delegates", teamEfficiencySummary(hist).includes("Duplicate risk"), true);
    const blocked = findDuplicateDelegate(hist, "scout", "brief on Bay Area doc sponsors again");
    check("duplicate: blocks repeat scout within window", Boolean(blocked && blocked.report?.includes("Prior")), true);
    check(
      "duplicate: blocked message tells Iris to relay only",
      duplicateBlockedMessage(hist[0], "America/Los_Angeles").includes("DUPLICATE BLOCKED"),
      true,
    );
  }
  check("iris team: scout opens research module", IRIS_TEAM.find((s) => s.id === "scout")?.module, "research");
  check("iris team: ledger owns today", IRIS_TEAM.find((s) => s.id === "ledger")?.module, "today");
  check("hud: research is in More, not tabs", HUD_MORE.includes("research") && !HUD_TABS.includes("research"), true);
}

// ── Server-side live commute
{
  const cs = { timezone: "America/Los_Angeles", schoolStartTime: "08:00", useLiveCommute: true, commuteMinutes: 35 };
  // Wed Nov 4 2026, PST (UTC-8)
  check("commute: checks traffic 4–8 AM on school days only", [
    inCommuteWindow(cs, new Date("2026-11-04T11:30:00Z")), // 3:30 AM
    inCommuteWindow(cs, new Date("2026-11-04T12:15:00Z")), // 4:15 AM
    inCommuteWindow(cs, new Date("2026-11-04T15:45:00Z")), // 7:45 AM
    inCommuteWindow(cs, new Date("2026-11-04T16:30:00Z")), // 8:30 AM
    inCommuteWindow(cs, new Date("2026-11-07T15:00:00Z")), // Saturday 7 AM
  ], [false, true, true, false, false]);
  const at = new Date("2026-11-04T15:00:00Z");
  const live = { minutes: 48, fetchedAt: "2026-11-04T14:45:00Z" };
  check("commute: fresh live minutes win", commuteMinutesFor(cs, live, at), 48);
  check("commute: stale live minutes fall back", commuteMinutesFor(cs, { ...live, fetchedAt: "2026-11-04T13:00:00Z" }, at), 35);
  check("commute: live off → usual minutes", commuteMinutesFor({ ...cs, useLiveCommute: false }, live, at), 35);
  const lb = computeServerLeaveBy({ ...settings, timezone: "America/Los_Angeles", schoolStartTime: "08:00", arriveBufferMinutes: 5, commuteMinutes: 35 } as never, new Date("2026-11-04T15:00:00Z"), 48);
  check("commute: server leave-by uses live minutes", lb && new Date(lb.leaveBy).toISOString(), "2026-11-04T15:07:00.000Z");
}

// ── What Iris can see: inbox, memos, money, gym, shopping (privacy first)
{
  const mail = [
    { from: "Jordan Lee <jordan@sponsor.com>", subject: "Sponsor deck feedback", date: "2026-11-04T17:00:00Z", unread: true },
    { from: '"Ms. Rivera" <rivera@vallejo.k12.ca.us>', subject: "Field trip forms", date: "2026-11-04T16:00:00Z", unread: true },
    { from: "Shopify <no-reply@shopify.com>", subject: "Easy Supply order #1042", date: "2026-11-04T15:00:00Z", unread: false },
    { from: "Dana Brooks <dana@gmail.com>", subject: "Question about my son's grades", date: "2026-11-04T14:00:00Z", unread: true },
    { from: "Coach T <t@gmail.com>", subject: "Practice moved", date: "2026-11-04T13:00:00Z", unread: false },
  ];
  const inbox = IC.inboxContext(mail, "America/Los_Angeles", { schoolNames: ["Coach T"] });
  check("iris sees: inbox senders + subjects, unread first", inbox.includes('[unread] Jordan Lee: "Sponsor deck feedback"') && inbox.includes('Shopify: "Easy Supply order #1042"'), true);
  check("iris sees: school/family emails counted, not named", [inbox.includes("Rivera"), inbox.includes("Field trip"), inbox.includes("Dana"), inbox.includes("son's"), inbox.includes("Coach T"), inbox.includes("Plus 3 school or family emails (details withheld)")], [false, false, false, false, false, true]);
  check("iris sees: never an email address", /@/.test(inbox), false);
  const memos = IC.memosContext([
    { at: "2026-11-04T18:00:00Z", text: "Conversation with Iris\nYou: hi" },
    { at: "2026-11-04T17:00:00Z", text: "Idea: $BAY episode in Oakland at the lake" },
    { at: "2026-11-03T17:00:00Z", text: "Call the student's parent about attendance" },
  ], "America/Los_Angeles");
  check("iris sees: memos, skips chat transcripts, withholds school notes", [memos.includes("$BAY episode"), memos.includes("Conversation"), memos.includes("attendance"), memos.includes("1 school-related memo")], [true, false, false, true]);
  check("iris sees: money", IC.moneyContext({ income: 1250, spent: 410.5, net: 839.5, ecsRevenue: 900, topSpend: [["Food", 220], ["Gas", 120]] }, "November", 2000), "Money (November, from the Money tab): in $1,250, out $411, net $840. ECS revenue $900 of $2,000 goal. Top spending: Food $220, Gas $120.");
  check(
    "iris sees: markets under money",
    IC.stocksContext({
      watchlist: [
        { symbol: "NVDA", changePercent: 2.1, theme: "ai" },
        { symbol: "AVAV", changePercent: -1.4, theme: "drones" },
      ],
      upcomingIpos: [{ name: "Acme AI", symbol: "ACME", date: "2026-12-01" }],
      dataSource: "finnhub",
    }).includes("NVDA up"),
    true,
  );
  check("iris sees: gym week", IC.gymContext({ workoutsThisWeek: 1, target: 3, loggedToday: false, next: { title: "Legs", day: "Thu", isToday: false } }), "Gym: 1 of 3 workouts this week. Next session: Legs on Thu.");
  check("iris sees: shopping list (not pantry)", IC.shoppingContext([{ name: "Chicken", inPantry: false }, { name: "Rice", inPantry: true }, { name: "Spinach", inPantry: false }]), "Shopping list (2): Chicken, Spinach.");
}

// Times on screen use the IRIS time zone, not the device's (iMac, travel).
check("clock: event and leave-by times in IRIS time zone", [clockTime("2026-11-04T19:00:00Z", "America/Los_Angeles"), clockTime(new Date("2026-11-04T15:20:00Z"), "America/Los_Angeles"), clockTime("bad", TZ)], ["11:00 AM", "7:20 AM", ""]);

// ── Iris voice labels (browser speechSynthesis sorting)
{
  check("iris voice tier: premium in name", Voices.voiceTier("Ava (Premium) (en-US)"), "premium");
  check("iris voice tier: enhanced", Voices.voiceTier("Samantha (Enhanced) (en-US)"), "enhanced");
  check("iris voice tier: standard default", Voices.voiceTier("Karen"), "standard");
  check("iris voice rank: Samantha before Karen", Voices.recommendationRank("Samantha") < Voices.recommendationRank("Karen"), true);
  check("iris voice: Google US English recommended", Voices.isRecommendedIrisVoice("Google US English"), true);
  const mockVoice = { name: "Samantha (Enhanced) (en-US)", lang: "en-US" } as SpeechSynthesisVoice;
  check("iris voice label includes tier", Voices.irisVoiceOptionLabel(mockVoice, "American").includes("Enhanced"), true);
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
if (!process.env.TIME_CHECK_CHILD) console.log("\nAll time-logic checks passed.");
