"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tortuca-my-list";

export function useMyList() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [serverSync, setServerSync] = useState(false);

  const persistLocal = useCallback((next: string[]) => {
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      setIds([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      const res = await fetch("/api/me/my-list");
      if (res.status === 401) return;
      if (!res.ok) return;
      const data = (await res.json()) as {
        filmIds: string[];
        persisted?: boolean;
      };
      if (data.persisted) {
        persistLocal(data.filmIds);
        setServerSync(true);
      }
    })();
  }, [ready, persistLocal]);

  const syncServer = useCallback(async (next: string[]) => {
    const res = await fetch("/api/me/my-list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmIds: next }),
    });
    if (res.ok) setServerSync(true);
  }, []);

  const isInList = useCallback((filmId: string) => ids.includes(filmId), [ids]);

  const toggle = useCallback(
    (filmId: string) => {
      const next = ids.includes(filmId)
        ? ids.filter((id) => id !== filmId)
        : [...ids, filmId];
      persistLocal(next);
      if (serverSync) void syncServer(next);
    },
    [ids, persistLocal, serverSync, syncServer],
  );

  return { ids, isInList, toggle, ready };
}
