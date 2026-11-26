import { useCallback, useEffect, useState } from "react";
import type { SureSummarySnapshot } from "../../shared/sureIrisBridge";
import { authHeaders } from "../lib/google";

const SYNC_MS = 30 * 60 * 1000;

export function useSureSummary() {
  const [snapshot, setSnapshot] = useState<SureSummarySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sure-summary", { headers: authHeaders() });
      const data = (await res.json().catch(() => null)) as SureSummarySnapshot | null;
      if (data && (res.ok || res.status === 502)) setSnapshot(data);
      else setSnapshot({ configured: false, dataSource: "unconfigured" });
    } catch {
      setSnapshot({ configured: false, dataSource: "error", error: "Sure summary unavailable" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), SYNC_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { snapshot, loading, refresh };
}