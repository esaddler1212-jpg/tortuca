import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_HUB, type HubState } from "../../shared/hub";
import { fetchUserData, saveUserDataRemote } from "../lib/userData";
import { loadJson, saveJson } from "../lib/storage";

const HUB_KEY = "alfred-hub-v1";

function normalize(h: Partial<HubState> | null | undefined): HubState {
  return { ...EMPTY_HUB, ...(h ?? {}), links: { ...(h?.links ?? {}) } };
}

/**
 * Feed sources, watchers, gym log, money, memos and links: saved on the device
 * and synced through Alfred's server (newest copy wins), like the plan.
 */
export function useHub() {
  const [hub, setHub] = useState<HubState>(() => normalize(loadJson<HubState | null>(HUB_KEY, null)));
  const loadedRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const remote = (await fetchUserData())?.hub as HubState | undefined;
        if (remote && remote.updatedAt > hub.updatedAt) setHub(normalize(remote));
      } catch {
        /* offline */
      } finally {
        loadedRemote.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveJson(HUB_KEY, hub);
    if (!loadedRemote.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saveUserDataRemote({ hub }).catch(() => undefined);
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hub]);

  /** Apply a change and stamp it (newest wins across devices). */
  const update = useCallback((fn: (h: HubState) => HubState) => {
    setHub((h) => ({ ...fn(h), updatedAt: new Date().toISOString() }));
  }, []);

  return { hub, update };
}
