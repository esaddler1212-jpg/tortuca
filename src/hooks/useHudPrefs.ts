import { useCallback, useState } from "react";
import { DEFAULT_HUD_PREFS, loadHudPrefs, saveHudPrefs, type HudPrefs } from "../lib/hudPrefs";

export function useHudPrefs() {
  const [prefs, setPrefs] = useState<HudPrefs>(() => loadHudPrefs());
  const update = useCallback((patch: Partial<HudPrefs>) => {
    const next = saveHudPrefs(patch);
    setPrefs(next);
    return next;
  }, []);
  const reset = useCallback(() => {
    const next = saveHudPrefs(DEFAULT_HUD_PREFS);
    setPrefs(next);
  }, []);
  return { prefs, update, reset };
}
