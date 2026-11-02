import { useEffect, useState } from "react";
import type { PulseSnapshot } from "../../shared/pulse";

/** Fetch the Pulse for these coordinates; refresh every 10 minutes while open. */
export function usePulse(lat: number, lon: number) {
  const [pulse, setPulse] = useState<PulseSnapshot | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/pulse?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as PulseSnapshot;
        if (!cancelled) {
          setPulse(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    void load();
    const t = setInterval(load, 10 * 60_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, [lat, lon]);
  return { pulse, error };
}
