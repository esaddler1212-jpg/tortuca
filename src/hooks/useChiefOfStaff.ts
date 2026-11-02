import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeCos, type CosInboxItem, type CosState } from "../../shared/chiefOfStaff";
import { fetchUserData, saveUserDataRemote } from "../lib/userData";
import { loadJson, saveJson } from "../lib/storage";

const COS_KEY = "alfred-cos-v1";

/**
 * ECS Chief of Staff state: saved on the device and synced through Alfred's
 * server (newest copy wins), like the plan and hub. The agent's inbox is
 * read-only here (the server owns it); handled items are tracked in the state.
 */
export function useChiefOfStaff() {
  const [cos, setCos] = useState<CosState>(() => normalizeCos(loadJson<CosState | null>(COS_KEY, null)));
  const [inbox, setInbox] = useState<CosInboxItem[]>([]);
  const loadedRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshInbox = useCallback(async () => {
    try {
      const remote = await fetchUserData();
      setInbox(((remote?.cosInbox ?? []) as CosInboxItem[]).filter((i) => i && i.id));
      return remote;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const remote = await refreshInbox();
        const r = remote?.cos as CosState | undefined;
        if (r && r.updatedAt > cos.updatedAt) setCos(normalizeCos(r));
      } finally {
        loadedRemote.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveJson(COS_KEY, cos);
    if (!loadedRemote.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saveUserDataRemote({ cos }).catch(() => undefined);
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [cos]);

  const update = useCallback((fn: (c: CosState) => CosState) => {
    setCos((c) => ({ ...fn(c), updatedAt: new Date().toISOString() }));
  }, []);

  const openInbox = inbox.filter((i) => !cos.inboxHandled.includes(i.id));

  return { cos, update, inbox: openInbox, refreshInbox };
}
