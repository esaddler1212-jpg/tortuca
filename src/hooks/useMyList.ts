"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tortuca-my-list";

export function useMyList() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      setIds([]);
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const isInList = useCallback((filmId: string) => ids.includes(filmId), [ids]);

  const toggle = useCallback(
    (filmId: string) => {
      persist(
        ids.includes(filmId) ? ids.filter((id) => id !== filmId) : [...ids, filmId],
      );
    },
    [ids, persist],
  );

  return { ids, isInList, toggle, ready };
}
