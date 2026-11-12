import { useCallback, useEffect, useState } from "react";
import type { PulseSnapshot } from "../../shared/pulse";

/** Fetch the Pulse for these coordinates; refresh every 10 minutes while open. */
export function usePulse(lat: number, lon: number) {
  const [pulse, setPulse] = useState<PulseSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pulse?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PulseSnapshot;
      setPulse(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    void reload();
    const t = setInterval(() => void reload(), 10 * 60_000);
    const onVis = () => void reload();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reload]);

  return { pulse, error, loading, reload };
}
