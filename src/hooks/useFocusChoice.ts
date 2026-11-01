import { useCallback, useEffect, useState } from "react";
import type { DayMode, FocusChoice } from "../../shared/dayMode";

const KEY = "alfred-focus-choice";

interface Stored {
  choice: FocusChoice;
  /** The clock's mode when the choice was made. */
  autoAt: DayMode;
}

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

/**
 * The header's Focus menu. A manual pick holds until the clock's mode next
 * changes (e.g. school dismissal at 2:18), then it returns to Auto.
 */
export function useFocusChoice(autoMode: DayMode) {
  const [stored, setStored] = useState<Stored | null>(load);

  useEffect(() => {
    if (stored && stored.choice !== "auto" && stored.autoAt !== autoMode) {
      setStored(null);
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* storage unavailable */
      }
    }
  }, [autoMode, stored]);

  const choose = useCallback(
    (choice: FocusChoice) => {
      const next = choice === "auto" ? null : { choice, autoAt: autoMode };
      setStored(next);
      try {
        if (next) localStorage.setItem(KEY, JSON.stringify(next));
        else localStorage.removeItem(KEY);
      } catch {
        /* storage unavailable */
      }
    },
    [autoMode],
  );

  const choice: FocusChoice = stored && stored.autoAt === autoMode ? stored.choice : "auto";
  return { choice, choose };
}
