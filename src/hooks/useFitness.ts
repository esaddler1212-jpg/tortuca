import { useCallback, useEffect, useRef, useState } from "react";
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

  // Push only real edits made here: not what we just loaded on open, and not
  // a copy that came from another device (that would overwrite newer data).
  const skipPush = useRef(true);
  useEffect(() => {
    saveJson(FITNESS_KEY, logs);
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void saveUserDataRemote({ fitnessLogs: logs }).catch(() => undefined);
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
    setLogs((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(remote)) return prev;
      skipPush.current = true;
      return remote;
    });
  }, []);

  return { logs, logWorkout, loadRemote };
}
