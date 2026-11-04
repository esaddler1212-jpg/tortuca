import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_HUB, type HubState } from "../../shared/hub";
import { fetchUserData, saveUserDataRemote } from "../lib/userData";
import { onRemoteData } from "../lib/remoteSync";
import { loadJson, saveJson } from "../lib/storage";

const HUB_KEY = "alfred-hub-v1";

function normalize(h: Partial<HubState> | null | undefined): HubState {
  return { ...EMPTY_HUB, ...(h ?? {}), links: { ...(h?.links ?? {}) } };
}

/**
 * Feed sources, watchers, gym log, money, memos and links: saved on the device
 * and synced through Iris's server (newest copy wins), like the plan.
 */
export function useHub() {
  const [hub, setHub] = useState<HubState>(() => normalize(loadJson<HubState | null>(HUB_KEY, null)));
  const loadedRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fromRemote = useRef(false);
  const latest = useRef(hub);
  latest.current = hub;

  // Another device changed it: take the newer copy (unless an edit here is about to save).
  useEffect(
    () =>
      onRemoteData((data) => {
        const remote = data.hub as HubState | undefined;
        if (!remote || timer.current || !(remote.updatedAt > latest.current.updatedAt)) return;
        fromRemote.current = true;
        setHub(normalize(remote));
      }),
     
    [],
  );

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
    if (fromRemote.current) {
      fromRemote.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
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
