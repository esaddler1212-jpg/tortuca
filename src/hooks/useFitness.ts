import { useCallback, useEffect, useState } from "react";
import type { FitnessLog } from "../types";
import { workoutSlot } from "../lib/fitness";
import type { UserSettings } from "../types";
import { loadJson, saveJson } from "../lib/storage";
import { saveUserDataRemote } from "../lib/userData";

const FITNESS_KEY = "alfred-fitness-logs";

export function useFitness(settings: UserSettings) {
  const [logs, setLogs] = useState<FitnessLog[]>(() =>
    loadJson<FitnessLog[]>(FITNESS_KEY, []),
  );

  useEffect(() => {
    saveJson(FITNESS_KEY, logs);
    const timer = setTimeout(() => {
      void saveUserDataRemote({ fitnessLogs: logs });
    }, 600);
    return () => clearTimeout(timer);
  }, [logs]);

  const logWorkout = useCallback(
    (type: FitnessLog["type"], when = new Date()) => {
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone }).format(when);
      setLogs((prev) => {
        const withoutToday = prev.filter((l) => l.date !== date);
        return [
          {
            id: crypto.randomUUID(),
            type,
            date,
            loggedAt: when.toISOString(),
            slot: workoutSlot(settings, when),
          },
          ...withoutToday,
        ];
      });
    },
    [settings],
  );

  const loadRemote = useCallback((remote: FitnessLog[]) => {
    if (remote.length > 0) setLogs(remote);
  }, []);

  return { logs, logWorkout, loadRemote };
}
