/**
 * The Hub: feed sources, page watchers, gym routine, money, voice memos and
 * quick links. Pure logic + defaults, shared by the app and Netlify functions.
 * (Ideas borrowed from Glance/Miniflux, changedetection.io, wger, Actual Budget
 * and whisper.cpp, rebuilt small for IRIS.)
 */
import type { Area } from "./planData";
import { addDays, weekdayOfDay } from "./timezone";

// ── The Feed ─────────────────────────────────────────────────────────────

export type FeedTopic = "Bay Area" | "Film" | "Music" | "Merch" | "Education" | "AI";
export const FEED_TOPICS: FeedTopic[] = ["Bay Area", "Film", "Music", "Merch", "Education", "AI"];

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  topic: FeedTopic;
}

export const DEFAULT_FEEDS: FeedSource[] = [
  { id: "kqed", name: "KQED News", url: "https://www.kqed.org/news/feed", topic: "Bay Area" },
  { id: "vth", name: "Vallejo Times-Herald", url: "https://www.timesheraldonline.com/feed/", topic: "Bay Area" },
  { id: "nfs", name: "No Film School", url: "https://nofilmschool.com/rss.xml", topic: "Film" },
  { id: "filmmaker", name: "Filmmaker Magazine", url: "https://filmmakermagazine.com/feed/", topic: "Film" },
  { id: "mbw", name: "Music Business Worldwide", url: "https://www.musicbusinessworldwide.com/feed/", topic: "Music" },
  { id: "pitchfork", name: "Pitchfork News", url: "https://pitchfork.com/feed/feed-news/rss", topic: "Music" },
  { id: "hypebeast", name: "Hypebeast", url: "https://hypebeast.com/feed", topic: "Merch" },
  { id: "mindshift", name: "KQED MindShift", url: "https://www.kqed.org/mindshift/feed", topic: "Education" },
  { id: "edsurge", name: "EdSurge", url: "https://www.edsurge.com/articles_rss", topic: "Education" },
  { id: "verge-ai", name: "The Verge · AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", topic: "AI" },
];

export interface FeedItem {
  title: string;
  link: string;
  published?: string;
  source: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decodeEntities(m[1]) : undefined;
}

/** Parse RSS 2.0 or Atom (YouTube channel feeds are Atom) into items. */
export function parseFeed(xml: string, source: string, limit = 8): FeedItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  const items: FeedItem[] = [];
  for (const b of blocks.slice(0, limit)) {
    const title = tag(b, "title");
    let link = tag(b, "link");
    if (!link) link = b.match(/<link[^>]*href="([^"]+)"/i)?.[1];
    const published = tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date");
    if (title && link) items.push({ title, link: link.trim(), published, source });
  }
  return items;
}

/** Only public http(s) URLs: no localhost, private ranges or raw-IP hosts. */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return false; // IP literals
  return true;
}

// ── Watchers ─────────────────────────────────────────────────────────────

export interface Watcher {
  id: string;
  name: string;
  url: string;
  /** Optional: alert when this text appears on the page (e.g. "applications open"). */
  lookFor?: string;
  /** Uptime watcher (Uptime Kuma idea): checked every 10 minutes, alerts when it goes down or comes back. */
  uptime?: boolean;
}

/** Server-owned result of the last check, keyed by watcher id. */
export interface WatchResult {
  hash?: string;
  checkedAt: string;
  changedAt?: string;
  /** For lookFor watchers: whether the text is on the page now. */
  found?: boolean;
  /** A short line of what's new, when we can tell. */
  snippet?: string;
  error?: string;
  /** Uptime watchers: is it up, how fast it answered, recent checks (newest last). */
  up?: boolean;
  ms?: number;
  status?: number;
  history?: UptimeMark[];
  /** Failed checks in a row (alert at 2, so one blip doesn't wake you). */
  fails?: number;
  downSince?: string;
}

/** One uptime check: "u" up, "d" down. */
export type UptimeMark = "u" | "d";
const UPTIME_HISTORY = 144; // 24 h at one check per 10 minutes

/** Responding counts as up; a login wall (401/403) still means the site is up. */
export function isUpStatus(status: number): boolean {
  return (status >= 200 && status < 400) || status === 401 || status === 403;
}

/** Turn one probe into the new state and, when it flips, an alert. */
export function evaluateUptime(
  w: Watcher,
  prev: WatchResult | undefined,
  probe: { status?: number; ms?: number; error?: string },
  now: string,
): { result: WatchResult; alert: string | null } {
  const ok = probe.status !== undefined && isUpStatus(probe.status);
  const fails = ok ? 0 : (prev?.fails ?? 0) + 1;
  const history = [...(prev?.history ?? []), ok ? "u" : "d"].slice(-UPTIME_HISTORY) as UptimeMark[];
  const wasDown = prev?.up === false;
  const reason = probe.error ?? (probe.status !== undefined ? `HTTP ${probe.status}` : "no answer");
  let alert: string | null = null;
  let up = prev?.up ?? true;
  let downSince = prev?.downSince;
  if (ok) {
    if (wasDown) alert = `🟢 ${w.name} is back up${downSince ? ` (down ${durationText(Date.parse(now) - Date.parse(downSince))})` : ""}`;
    up = true;
    downSince = undefined;
  } else if (fails >= 2 && !wasDown) {
    up = false;
    downSince = prev?.checkedAt ?? now;
    alert = `🔴 ${w.name} is down (${reason})`;
  } else if (fails >= 2) {
    up = false;
  }
  return {
    result: {
      checkedAt: now,
      up,
      ms: probe.ms,
      status: probe.status,
      history,
      fails,
      downSince,
      changedAt: alert ? now : prev?.changedAt,
      error: ok ? undefined : reason,
    },
    alert,
  };
}

/** Share of recent checks that were up, e.g. 99.3. */
export function uptimePercent(history: UptimeMark[] | undefined): number | null {
  if (!history?.length) return null;
  const up = history.filter((m) => m === "u").length;
  return Math.round((up / history.length) * 1000) / 10;
}

export function durationText(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

/** Page HTML → comparable text (scripts, styles and tags removed). */
export function pageText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<(br|p|div|li|h\d|tr)[^>]*>/gi, "\n"),
  );
}

/** First sentence-ish chunk present now that wasn't before (best effort). */
export function newSnippet(before: string, after: string): string | undefined {
  const old = new Set(before.split(/(?<=[.!?])\s+/).map((s) => s.trim()));
  const fresh = after
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .find((s) => s.length > 20 && !old.has(s));
  return fresh ? fresh.slice(0, 160) : undefined;
}

/** Decide what a new check means for the user. */
export function evaluateCheck(
  w: Watcher,
  prev: WatchResult | undefined,
  text: string,
  hash: string,
  now: string,
): { result: WatchResult; alert: string | null } {
  if (w.lookFor) {
    const found = text.toLowerCase().includes(w.lookFor.toLowerCase());
    const appeared = found && prev?.found === false;
    return {
      result: { hash, checkedAt: now, found, changedAt: appeared ? now : prev?.changedAt },
      alert: appeared ? `"${w.lookFor}" is now on ${w.name}` : null,
    };
  }
  const changed = Boolean(prev?.hash) && prev?.hash !== hash;
  return {
    result: { hash, checkedAt: now, changedAt: changed ? now : prev?.changedAt, snippet: changed ? undefined : prev?.snippet },
    alert: changed ? `${w.name} changed` : null,
  };
}

// ── Gym (Tue arms & chest · Thu legs · Sun cardio) ───────────────────────

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  /** Track a weight for this one. */
  weighted?: boolean;
  /** Matching entry in the exercise library (how-to steps, muscles, swaps). */
  libId?: string;
}

export interface GymDay {
  weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  title: string;
  workout: "arms" | "legs" | "body" | "cardio";
  exercises: Exercise[];
}

export const DEFAULT_ROUTINE: GymDay[] = [
  {
    weekday: "Tue",
    title: "Arms & chest",
    workout: "arms",
    exercises: [
      { id: "bench", name: "Bench press", sets: 4, reps: "8", weighted: true, libId: "0025" },
      { id: "incline-db", name: "Incline dumbbell press", sets: 3, reps: "10", weighted: true, libId: "0314" },
      { id: "fly", name: "Cable fly", sets: 3, reps: "12", weighted: true, libId: "0171" },
      { id: "curl", name: "Dumbbell curl", sets: 3, reps: "12", weighted: true, libId: "0294" },
      { id: "dips", name: "Tricep dips", sets: 3, reps: "10", libId: "0814" },
    ],
  },
  {
    weekday: "Thu",
    title: "Legs",
    workout: "legs",
    exercises: [
      { id: "squat", name: "Back squat", sets: 4, reps: "8", weighted: true, libId: "0043" },
      { id: "rdl", name: "Romanian deadlift", sets: 3, reps: "10", weighted: true, libId: "0085" },
      { id: "lunge", name: "Walking lunges", sets: 3, reps: "12 / leg", weighted: true, libId: "1460" },
      { id: "legpress", name: "Leg press", sets: 3, reps: "12", weighted: true, libId: "0739" },
      { id: "calf", name: "Calf raises", sets: 4, reps: "15", weighted: true, libId: "0605" },
    ],
  },
  {
    weekday: "Sun",
    title: "Cardio & core",
    workout: "cardio",
    exercises: [
      { id: "zone2", name: "Easy run or bike", sets: 1, reps: "30 min", libId: "2138" },
      { id: "intervals", name: "Intervals (30s hard / 60s easy)", sets: 8, reps: "1", libId: "2612" },
      { id: "core", name: "Core circuit: plank, dead bug, side plank", sets: 3, reps: "45s each", libId: "0464" },
    ],
  },
];

export type GymLog = Record<string, Record<string, { done?: boolean; weight?: number }>>;

/** Today's gym day, or the next one coming up (within a week). */
export function gymDayFor(routine: GymDay[], today: string): { day: string; plan: GymDay; isToday: boolean } | null {
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    const plan = routine.find((r) => r.weekday === weekdayOfDay(d));
    if (plan) return { day: d, plan, isToday: i === 0 };
  }
  return null;
}

/** Most recent weight logged for an exercise before `day`. */
export function lastWeight(log: GymLog, exerciseId: string, before: string): number | undefined {
  const days = Object.keys(log).filter((d) => d < before).sort().reverse();
  for (const d of days) {
    const w = log[d]?.[exerciseId]?.weight;
    if (typeof w === "number") return w;
  }
  return undefined;
}

// ── Money ────────────────────────────────────────────────────────────────

export type MoneyCategory = Area | "Bills" | "Food" | "Gas" | "Gear" | "Other";
export const INCOME_CATEGORIES: MoneyCategory[] = ["ECS", "Easy Supply", "2EASY", "Tortuga", "North Star", "Personal", "Other"];
export const EXPENSE_CATEGORIES: MoneyCategory[] = ["Bills", "Food", "Gas", "Gear", "ECS", "Easy Supply", "2EASY", "Tortuga", "North Star", "Other"];
const ECS_AREAS = new Set<MoneyCategory>(["ECS", "Easy Supply", "2EASY", "Tortuga", "North Star"]);

export interface MoneyEntry {
  id: string;
  date: string;
  kind: "in" | "out";
  amount: number;
  category: MoneyCategory;
  note?: string;
}

/** Start small, climb toward $100K/month (same ladder as the ECS roadmap). */
export const REVENUE_LADDER = [1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000];

export function moneyMonth(entries: MoneyEntry[], month: string) {
  const list = entries.filter((e) => e.date.startsWith(month));
  const sum = (f: (e: MoneyEntry) => boolean) => list.filter(f).reduce((n, e) => n + e.amount, 0);
  const income = sum((e) => e.kind === "in");
  const spent = sum((e) => e.kind === "out");
  const byCat = new Map<MoneyCategory, number>();
  for (const e of list.filter((x) => x.kind === "out")) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  return {
    income,
    spent,
    net: income - spent,
    ecsRevenue: sum((e) => e.kind === "in" && ECS_AREAS.has(e.category)),
    topSpend: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}

// ── Voice memos ──────────────────────────────────────────────────────────

export interface Memo {
  id: string;
  at: string;
  text: string;
  /** Set once its to-dos were added. */
  todosAdded?: boolean;
}

const TODO_CUES =
  /\b(?:(?:i|we)\s+(?:need|have|got|gotta|should|must|want)\s+to\s+|remember\s+to\s+|don't\s+forget\s+to\s+|reminder\s*:?\s*(?:to\s+)?|todo\s*:?\s*|to\s+do\s*:?\s*)(.+)$/i;
const ACTION_START = /^(call|email|text|send|buy|book|pay|finish|schedule|follow up|ask|order|post|upload|record|write|draft|submit|sign|check|set up|reach out)\b/i;

/** Pull to-dos out of a memo: "I need to call Mike", "remember to send the deck"… */
export function extractTodos(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/(?<=[.!?])\s+|\n+|\s*,?\s+(?:and then|also|then)\s+/i)) {
    const s = raw
      .trim()
      .replace(/[.!?]+$/, "")
      .replace(/^(?:(?:okay|ok|so|um|uh|and|alright|yeah|also)[,\s]+)+/i, "");
    if (!s) continue;
    const cue = s.match(TODO_CUES);
    const task = cue ? cue[1] : ACTION_START.test(s) ? s : null;
    if (task && task.length >= 4) out.push(task.charAt(0).toUpperCase() + task.slice(1));
  }
  return [...new Set(out)];
}

// ── State ────────────────────────────────────────────────────────────────

export interface HubState {
  /** null = default sources. */
  feeds: FeedSource[] | null;
  watchers: Watcher[];
  routine: GymDay[] | null;
  gymLog: GymLog;
  money: MoneyEntry[];
  revenueGoal: number;
  memos: Memo[];
  links: { booking?: string; notes?: string };
  updatedAt: string;
}

export const EMPTY_HUB: HubState = {
  feeds: null,
  watchers: [],
  routine: null,
  gymLog: {},
  money: [],
  revenueGoal: REVENUE_LADDER[0],
  memos: [],
  links: {},
  updatedAt: new Date(0).toISOString(),
};
