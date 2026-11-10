import { useCallback, useEffect, useRef, useState } from "react";
import { defaultTierA, mergeTierA, type TierAState } from "../../shared/tierAOps";
import { loadJson, saveJson } from "../lib/storage";
import { onRemoteData } from "../lib/remoteSync";
import { saveUserDataRemote } from "../lib/userData";

const KEY = "iris-tier-a-local";

export function useTierA() {
  const [tierA, setTierA] = useState<TierAState>(() => loadJson(KEY, defaultTierA()));
  const latest = useRef(tierA);
  latest.current = tierA;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () =>
      onRemoteData((data) => {
        if (!data.tierA) return;
        const merged = mergeTierA(latest.current, data.tierA);
        if (JSON.stringify(merged) !== JSON.stringify(latest.current)) {
          setTierA(merged);
          saveJson(KEY, merged);
        }
      }),
    [],
  );

  const patchTierA = useCallback((patch: Partial<TierAState>) => {
    setTierA((prev) => {
      const next = mergeTierA(prev, patch);
      saveJson(KEY, next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void saveUserDataRemote({ tierA: next });
      }, 800);
      return next;
    });
  }, []);

  return { tierA, patchTierA };
}
