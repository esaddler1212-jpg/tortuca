import { useCallback, useEffect, useState } from "react";
import type { StocksSnapshot } from "../types/stocks";

const SYNC_MS = 15 * 60 * 1000;

export function useStocks() {
  const [snapshot, setSnapshot] = useState<StocksSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error("Stocks unavailable");
      const data = (await res.json()) as StocksSnapshot;
      setSnapshot(data);
    } catch {
      setError("Could not load market data.");
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
