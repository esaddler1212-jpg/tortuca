import { useCallback, useEffect, useState } from "react";
import type { WeeklyAuditReport } from "../../shared/weeklyAuditor";
import { authHeaders } from "../lib/google";

export function useWeeklyAudit() {
  const [report, setReport] = useState<WeeklyAuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weekly-audit", { headers: authHeaders() });
      if (!res.ok) {
        setReport(null);
        return;
      }
      const data = (await res.json()) as WeeklyAuditReport & { at: string | null };
      setReport(data.at ? data : null);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { report, loading, reload };
}
