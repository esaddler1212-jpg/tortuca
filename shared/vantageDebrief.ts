import { dayKey } from "./timezone";

/** Daily Vantage Point debrief pasted or uploaded from Claude (or any source). */
export interface VantageDebrief {
  /** When it was saved in IRIS. */
  at: string;
  /** Calendar day this debrief is for (local YYYY-MM-DD). */
  forDay: string;
  text: string;
  source: "paste" | "file" | "claude";
}

export const VANTAGE_DEBRIEF_MAX_CHARS = 48_000;
export const VANTAGE_DEBRIEF_IRIS_CLIP = 6_000;

export function normalizeVantageDebriefText(raw: string): string {
  return raw.replace(/^\uFEFF/, "").trim().slice(0, VANTAGE_DEBRIEF_MAX_CHARS);
}

export function vantageDebriefForDay(
  debrief: VantageDebrief | null | undefined,
  today: string,
): VantageDebrief | null {
  if (!debrief?.text?.trim() || debrief.forDay !== today) return null;
  return debrief;
}

export function saveVantageDebrief(
  text: string,
  timeZone: string,
  source: VantageDebrief["source"] = "paste",
  forDay = dayKey(timeZone),
): VantageDebrief {
  return {
    at: new Date().toISOString(),
    forDay,
    text: normalizeVantageDebriefText(text),
    source,
  };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Iris context — full debrief for today (Claude Vantage Point import). */
export function vantageDebriefContext(
  debrief: VantageDebrief | null | undefined,
  today: string,
): string {
  const d = vantageDebriefForDay(debrief, today);
  if (!d) return "";
  const flat = d.text.replace(/\s+/g, " ").trim();
  return `Vantage Point debrief (imported ${d.source}, for ${d.forDay}): ${clip(flat, VANTAGE_DEBRIEF_IRIS_CLIP)}`;
}

/** Spoken “brief me” when today’s imported debrief is available. */
export function spokenVantageDebrief(text: string, name?: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const body = clip(flat, 4_500);
  const hello = name ? `${name}, ` : "";
  return `${hello}here's your Vantage Point debrief from Claude. ${body}`;
}
