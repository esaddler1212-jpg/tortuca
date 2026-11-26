/**
 * The Vantage Point newspaper is a separate daily job: it researches and
 * writes E's morning paper, publishes it to its own Claude artifact, and
 * emails it. This file is the handshake that lets that paper also become
 * Iris's own Vantage Point briefing in IRIS, instead of just living on its
 * own page.
 *
 * Flow: that job POSTs today's edition.json to /api/vantage-paper (see
 * netlify/functions/vantage-paper.ts) once it publishes. IRIS stores it on
 * the account and the Vantage Point briefing leads with it. If today's
 * paper never arrives, or what's stored is from a previous day, IRIS falls
 * back to the briefing Iris builds herself (src/lib/spokenBrief.ts
 * buildVantageBrief) — nothing here is required for IRIS to work.
 */
import { dayKey } from "./timezone";

export interface VantagePaperAttention {
  title: string;
  detail?: string;
  url?: string;
}

export interface VantagePaperResolved {
  title: string;
  detail?: string;
  url?: string;
}

export interface VantagePaperTask {
  title: string;
  status: "active" | "waiting";
  since?: string;
  due?: string;
  note?: string;
  url?: string;
}

export interface VantagePaperSource {
  name: string;
  url: string;
}

export interface VantagePaperStory {
  kicker?: string;
  headline: string;
  dek?: string;
  body?: string | string[];
  sources?: VantagePaperSource[];
}

export interface VantagePaperFrontierItem {
  field: string;
  headline: string;
  body?: string;
  horizon?: string;
}

export interface VantagePaperFounder {
  kicker?: string;
  title: string;
  body?: string[];
  moves?: string[];
}

export interface VantagePaperIdea {
  title: string;
  book?: string;
  author?: string;
  summary?: string;
}

export interface VantagePaperQuote {
  text: string;
  author: string;
}

export interface VantagePaperDay {
  note?: string;
  attention?: VantagePaperAttention[];
  resolved?: VantagePaperResolved[];
}

/**
 * Today's Vantage Point edition, as that job publishes it (edition.json).
 * IRIS's briefing only reads a handful of fields; everything else (markets,
 * weather, investor desk, sports, …) rides along unread via the index
 * signature so nothing is lost even as that paper grows new sections.
 */
export interface VantagePaperEdition {
  date: string;
  dateline?: string;
  edition?: number;
  day?: VantagePaperDay;
  tasks?: VantagePaperTask[];
  lead?: VantagePaperStory;
  watching?: string;
  frontier?: VantagePaperFrontierItem[];
  founder?: VantagePaperFounder;
  idea?: VantagePaperIdea;
  quote?: VantagePaperQuote;
  [key: string]: unknown;
}

/** What IRIS stores once the daily job delivers the paper. */
export interface StoredVantagePaper {
  edition: VantagePaperEdition;
  /** Link to the published page, for "open today's paper". */
  url: string;
  fetchedAt: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Loose shape check for what's posted to /api/vantage-paper — just enough to trust it's a real edition. */
export function isVantagePaperEdition(x: unknown): x is VantagePaperEdition {
  if (!x || typeof x !== "object") return false;
  const date = (x as { date?: unknown }).date;
  return typeof date === "string" && DATE_RE.test(date);
}

/** Only lead with the stored paper while it's actually today's, in IRIS's time zone. */
export function isFreshVantagePaper(stored: StoredVantagePaper | null | undefined, timeZone: string, now = new Date()): boolean {
  return !!stored?.edition?.date && stored.edition.date === dayKey(timeZone, now);
}
