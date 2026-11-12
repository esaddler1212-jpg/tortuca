import { useCallback, useEffect, useState } from "react";
import type { StocksSnapshot } from "../types/stocks";
import { authHeaders } from "../lib/google";

const SYNC_MS = 15 * 60 * 1000;

export function useStocks() {
  const [snapshot, setSnapshot] = useState<StocksSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks", { headers: authHeaders() });
      const data = (await res.json().catch(() => null)) as StocksSnapshot | null;
      if (!data || (!res.ok && !data.demoFallback)) throw new Error("Stocks unavailable");
      setSnapshot(data);
      if (!res.ok && data.demoFallback) setError(data.error ?? "Live data failed; showing demo quotes.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stocks unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), SYNC_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { snapshot, loading, error, refresh };
};
