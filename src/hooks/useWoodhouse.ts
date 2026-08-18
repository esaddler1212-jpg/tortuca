import { useCallback, useEffect, useState } from "react";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import { fetchWoodhouseSnapshot } from "../lib/woodhouse";

const SYNC_MS = 5 * 60 * 1000;

export function useWoodhouse() {
  const [snapshot, setSnapshot] = useState<WoodhouseOrchestrationSnapshot | null>(null);
  const [source, setSource] = useState<"live" | "demo" | "proxy" | "backup" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWoodhouseSnapshot();
      setSnapshot(result.snapshot);
      setSource(result.source);
      setLastSync(new Date());
    } catch {
      setError("Could not sync Woodhouse apps.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), SYNC_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { snapshot, source, loading, error, lastSync, refresh };
}
