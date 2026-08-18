import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_GOALS_PROGRESS,
  type Goals2026Progress,
  type MwfsHabit,
} from "../lib/goals2026";
import { loadJson, saveJson } from "../lib/storage";

const GOALS_KEY = "alfred-goals-2026";

export function useGoals2026() {
  const [progress, setProgress] = useState<Goals2026Progress>(() =>
    loadJson(GOALS_KEY, DEFAULT_GOALS_PROGRESS),
  );

  useEffect(() => {
    saveJson(GOALS_KEY, progress);
  }, [progress]);

  const toggleTrip = useCallback((id: string) => {
    setProgress((p) => ({
      ...p,
      trips: { ...p.trips, [id]: !p.trips[id] },
    }));
  }, []);

  const toggleMwfs = useCallback((dateKey: string, habit: MwfsHabit) => {
    setProgress((p) => {
      const day = p.mwfsLog[dateKey] ?? {};
      return {
        ...p,
        mwfsLog: {
          ...p.mwfsLog,
          [dateKey]: { ...day, [habit]: !day[habit] },
        },
      };
    });
  }, []);

  const toggleAiAgents = useCallback(() => {
    setProgress((p) => ({ ...p, aiAgents: !p.aiAgents }));
  }, []);

  return { progress, toggleTrip, toggleMwfs, toggleAiAgents };
}
