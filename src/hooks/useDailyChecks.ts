import { useCallback, useEffect, useState } from "react";
import { dayKey } from "../../shared/timezone";

const PREFIX = "alfred-done-today-";

function load(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * Items crossed off today that aren't your own to-dos (app follow-ups,
 * orders, roadmap actions). Stored per day on this device, so the list
 * starts fresh each morning; older days are cleaned up automatically.
 */
export function useDailyChecks(timeZone: string, now: Date) {
  const key = PREFIX + dayKey(timeZone, now);
  const [checked, setChecked] = useState<Set<string>>(() => load(key));

  // New day (or time zone): load that day's list and drop older ones.
  useEffect(() => {
    setChecked(load(key));
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX) && k !== key) localStorage.removeItem(k);
      }
    } catch {
      /* storage unavailable */
    }
  }, [key]);

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
          /* storage unavailable: still works for this session */
        }
        return next;
      });
    },
    [key],
  );

  return { checked, toggle };
}
