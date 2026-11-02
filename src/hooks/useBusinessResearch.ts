import { useCallback, useState } from "react";
import type { BusinessResearchRequest, BusinessResearchResult } from "../../shared/businessResearch";
import { runBusinessResearch } from "../lib/businessResearch";

export function useBusinessResearch(timeZone: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<BusinessResearchResult | null>(null);

  const research = useCallback(
    async (req: BusinessResearchRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await runBusinessResearch({ ...req, timeZone });
        setLast(result);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Research failed";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [timeZone],
  );

  return { research, loading, error, last, clearError: () => setError(null) };
}
