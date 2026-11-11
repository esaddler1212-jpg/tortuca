import { format } from "date-fns";
import type { WeatherSnapshot } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import type { StocksSnapshot } from "../types/stocks";
import { woodhouseBriefingLines } from "../lib/woodhouseBriefing";
import { stocksBriefingLines } from "../lib/stocksBriefing";
import { weatherLabel } from "../lib/weather";
import type { TierAState } from "../../shared/tierAOps";
import { orderBriefingLines, type BriefingLine, type BriefingSectionId } from "../../shared/tierAOps";

interface Props {
  weather: WeatherSnapshot | null;
  pendingTodos: number;
  unreadEmails: number;
  nextEventTitle?: string;
  userName?: string;
  woodhouse?: WoodhouseOrchestrationSnapshot | null;
  stocks?: StocksSnapshot | null;
  tierA?: TierAState | null;
  onBriefingPref?: (id: BriefingSectionId, delta: number) => void;
}

export function MorningBriefing({
  weather,
  pendingTodos,
  unreadEmails,
  nextEventTitle,
  userName,
  woodhouse,
  stocks,
  tierA,
  onBriefingPref,
}: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const raw: BriefingLine[] = [];
  if (weather) {
    raw.push({
      section: "weather",
      text: `It is ${Math.round(weather.temperature)}° with ${weatherLabel(weather.weatherCode).toLowerCase()}. Sunset today is at ${format(new Date(weather.sunset), "h:mm a")}.`,
    });
  }
  raw.push({
    section: "inbox",
    text:
      unreadEmails > 0
        ? `You have ${unreadEmails} unread message${unreadEmails === 1 ? "" : "s"}.`
        : "Your inbox is clear.",
  });
  if (pendingTodos > 0) {
    raw.push({
      section: "todos",
      text: `${pendingTodos} task${pendingTodos === 1 ? "" : "s"} remain on your list.`,
    });
  }
  if (nextEventTitle) {
    raw.push({ section: "schedule", text: `Next on your schedule: ${nextEventTitle}.` });
  }
  for (const w of woodhouseBriefingLines(woodhouse)) raw.push({ section: "woodhouse", text: w });
  for (const s of stocksBriefingLines(stocks ?? null)) raw.push({ section: "stocks", text: s });
  const openCmt = (tierA?.commitments ?? []).filter((c) => !c.done).length;
  if (openCmt) raw.push({ section: "commitments", text: `${openCmt} open commitment${openCmt === 1 ? "" : "s"} on your ledger.` });
  const w = tierA?.wearable;
  if (w?.sleepHours != null) {
    raw.push({ section: "wearable", text: `Recovery: about ${w.sleepHours} hours sleep logged.` });
  }
  const lines = orderBriefingLines(raw, tierA?.briefingPrefs).map((l) => l.text);

  return (
    <section className="panel p-6 border-alfred-gold/20">
      <p className="text-xs uppercase tracking-[0.2em] text-alfred-gold mb-2">Daily briefing</p>
      <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
        {greeting}{userName ? `, ${userName}` : ""}
      </h2>
      <p className="text-alfred-mist leading-relaxed max-w-2xl">
        {lines.join(" ")}
      </p>
      {onBriefingPref && (
        <p className="mt-3 flex flex-wrap gap-2 text-[11px] text-alfred-mist">
          More:
          {(["inbox", "stocks", "weather"] as BriefingSectionId[]).map((id) => (
            <button key={id} type="button" className="underline" onClick={() => onBriefingPref(id, 0.2)}>
              {id}
            </button>
          ))}
        </p>
      )}
      <p className="mt-4 text-sm italic text-alfred-mist/80 font-display">
        — Iris, at your service.
      </p>
    </section>
  );
}
