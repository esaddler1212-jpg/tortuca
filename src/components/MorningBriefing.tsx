import { format } from "date-fns";
import type { WeatherSnapshot } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import { woodhouseBriefingLines } from "../lib/woodhouseBriefing";
import { weatherLabel } from "../lib/weather";

interface Props {
  weather: WeatherSnapshot | null;
  pendingTodos: number;
  unreadEmails: number;
  nextEventTitle?: string;
  userName?: string;
  woodhouse?: WoodhouseOrchestrationSnapshot | null;
}

export function MorningBriefing({
  weather,
  pendingTodos,
  unreadEmails,
  nextEventTitle,
  userName,
  woodhouse,
}: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const lines: string[] = [];
  if (weather) {
    lines.push(
      `It is ${Math.round(weather.temperature)}° with ${weatherLabel(weather.weatherCode).toLowerCase()}. Sunset today is at ${format(new Date(weather.sunset), "h:mm a")}.`,
    );
  }
  if (unreadEmails > 0) {
    lines.push(`You have ${unreadEmails} unread message${unreadEmails === 1 ? "" : "s"}.`);
  } else {
    lines.push("Your inbox is clear.");
  }
  if (pendingTodos > 0) {
    lines.push(`${pendingTodos} task${pendingTodos === 1 ? "" : "s"} remain on your list.`);
  }
  if (nextEventTitle) {
    lines.push(`Next on your schedule: ${nextEventTitle}.`);
  }
  lines.push(...woodhouseBriefingLines(woodhouse));

  return (
    <section className="panel p-6 border-alfred-gold/20">
      <p className="text-xs uppercase tracking-[0.2em] text-alfred-gold mb-2">Daily briefing</p>
      <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
        {greeting}{userName ? `, ${userName}` : ""}
      </h2>
      <p className="text-alfred-mist leading-relaxed max-w-2xl">
        {lines.join(" ")}
      </p>
      <p className="mt-4 text-sm italic text-alfred-mist/80 font-display">
        — Alfred, at your service.
      </p>
    </section>
  );
}
