import { useEffect, useState } from "react";
import type { UserSettings } from "../types";
import { fetchLiveCommuteMinutes } from "../lib/userData";

export function useCommute(settings: UserSettings) {
  const [liveMinutes, setLiveMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.useLiveCommute || !settings.homeAddress.trim() || !settings.schoolAddress.trim()) {
      setLiveMinutes(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const minutes = await fetchLiveCommuteMinutes(settings.homeAddress, settings.schoolAddress);
      if (cancelled) return;
      if (minutes == null) {
        setError("Could not fetch live commute — using manual minutes.");
        setLiveMinutes(null);
      } else {
        setLiveMinutes(minutes);
      }
      setLoading(false);
    };

    void load();
    const interval = setInterval(() => void load(), 15 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    settings.useLiveCommute,
    settings.homeAddress,
    settings.schoolAddress,
    settings.commuteMinutes,
  ]);

  const effectiveMinutes = settings.useLiveCommute && liveMinutes != null ? liveMinutes : settings.commuteMinutes;

  return { liveMinutes, effectiveMinutes, loading, error };
}
