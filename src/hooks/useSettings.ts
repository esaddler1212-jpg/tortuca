import { useCallback, useEffect, useState } from "react";
import type { UserSettings } from "../types";
import { loadSettings, saveSettings } from "../lib/storage";
import { geocodeCity } from "../lib/weather";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback((next: UserSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const updateCity = useCallback(async (city: string) => {
    setSaving(true);
    setError(null);
    const geo = await geocodeCity(city);
    setSaving(false);
    if (!geo) {
      setError("Could not find that location. Try a nearby city name.");
      return false;
    }
    persist({
      ...settings,
      city: geo.name,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone,
    });
    return true;
  }, [persist, settings]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return { settings, persist, updateCity, saving, error, setError };
}
