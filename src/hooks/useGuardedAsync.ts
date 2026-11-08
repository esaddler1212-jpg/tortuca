/**
 * Stale-response guard for data loaders — pattern from Herald OS use-async.ts (MIT).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface GuardedAsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

function safeError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return "Something went wrong.";
}

export function useGuardedAsync<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): GuardedAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const generation = useRef(0);
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const mine = ++generation.current;
    setLoading(true);
    void loader()
      .then((value) => {
        if (mine !== generation.current) return;
        setData(value);
        setError(null);
      })
      .catch((err) => {
        if (mine !== generation.current) return;
        setError(safeError(err));
      })
      .finally(() => {
        if (mine === generation.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, enabled, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, reload };
}
