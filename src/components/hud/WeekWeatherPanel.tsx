import { CloudRain, Droplets } from "lucide-react";
import type { WeatherDay } from "../../types";
import { weatherLabel } from "../../lib/weather";
import { weekdayOfDay } from "../../../shared/timezone";
import { HudFrame } from "./HudFrame";

/** Sunday planning view: the week's highs/lows, conditions and rain chances. */
export function WeekWeatherPanel({ week, city }: { week: WeatherDay[]; city: string }) {
  if (!week.length) return null;
  const rainyDays = week.filter((d) => d.rainChance >= 50).map((d) => weekdayOfDay(d.date));
  const warmest = week.reduce((a, b) => (b.high > a.high ? b : a));
  const coolest = week.reduce((a, b) => (b.low < a.low ? b : a));

  return (
    <HudFrame title="Week ahead" tag={city}>
      <p className="font-mono text-xs text-cyan-100/85 mb-3">
        {rainyDays.length ? `Rain likely ${rainyDays.join(", ")}. ` : "No rain expected this week. "}
        Warmest {weekdayOfDay(warmest.date)} ({Math.round(warmest.high)}°), coolest night{" "}
        {weekdayOfDay(coolest.date)} ({Math.round(coolest.low)}°).
      </p>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {week.map((d, i) => (
          <li key={d.date} className={`hud-tile !px-1.5 sm:!px-2 text-center ${d.rainChance >= 50 ? "border-cyan-300/40" : ""}`}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
              {i === 0 ? "Today" : weekdayOfDay(d.date)}
            </p>
            <p className="font-mono text-sm text-cyan-100">{Math.round(d.high)}°</p>
            <p className="font-mono text-[11px] text-cyan-300/60">{Math.round(d.low)}°</p>
            <p className="mt-1 flex items-center justify-center gap-0.5 font-mono text-[10px] text-cyan-300/80" title={weatherLabel(d.weatherCode)}>
              {d.rainChance >= 50 ? <CloudRain className="h-3 w-3" aria-hidden /> : <Droplets className="h-3 w-3 opacity-50" aria-hidden />}
              {Math.round(d.rainChance)}%
            </p>
            <p className="hidden sm:block mt-0.5 text-[10px] leading-tight text-cyan-100/60 truncate">{weatherLabel(d.weatherCode)}</p>
          </li>
        ))}
      </ol>
    </HudFrame>
  );
}
