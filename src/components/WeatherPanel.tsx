import { CloudSun, RefreshCw, Sunrise, Sunset } from "lucide-react";
import type { WeatherSnapshot } from "../types";
import { formatTime, weatherLabel } from "../lib/weather";

interface Props {
  city: string;
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function WeatherPanel({ city, weather, loading, error, onRefresh }: Props) {
  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-alfred-gold">
          <CloudSun className="h-5 w-5" aria-hidden />
          <h2 className="font-display text-xl font-semibold tracking-wide">Today&apos;s weather</h2>
        </div>
        <button type="button" className="btn-ghost" onClick={onRefresh} aria-label="Refresh weather">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>
      <p className="text-sm text-alfred-mist mb-3">{city}</p>
      {error && <p className="text-sm text-red-300/90">{error}</p>}
      {!error && weather && (
        <div className="space-y-4">
          <div>
            <p className="font-display text-4xl font-semibold text-alfred-cream">
              {Math.round(weather.temperature)}°
            </p>
            <p className="text-alfred-mist">{weatherLabel(weather.weatherCode)}</p>
            <p className="text-sm text-alfred-mist mt-1">
              High {Math.round(weather.high)}° · Low {Math.round(weather.low)}°
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-alfred-border pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Sunrise className="h-4 w-4 text-alfred-gold" aria-hidden />
              <div>
                <p className="text-alfred-mist text-xs uppercase tracking-wider">Sunrise</p>
                <p>{formatTime(weather.sunrise)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sunset className="h-4 w-4 text-alfred-gold" aria-hidden />
              <div>
                <p className="text-alfred-mist text-xs uppercase tracking-wider">Sunset</p>
                <p className="text-alfred-gold font-medium">{formatTime(weather.sunset)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && !weather && <p className="text-sm text-alfred-mist animate-pulse">Consulting the forecast…</p>}
    </section>
  );
}
