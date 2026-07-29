import { useCallback, useEffect, useState } from "react";
import type { WeatherSnapshot } from "../types";
import type { UserSettings } from "../types";
import { fetchWeather } from "../lib/weather";

export function useWeather(settings: UserSettings) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(
        settings.latitude,
        settings.longitude,
        settings.timezone,
      );
      setWeather(data);
    } catch {
      setError("Unable to fetch weather right now.");
    } finally {
      setLoading(false);
    }
  }, [settings.latitude, settings.longitude, settings.timezone]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { weather, loading, error, refresh };
}
