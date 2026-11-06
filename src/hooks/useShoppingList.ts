import { useCallback, useEffect, useRef, useState } from "react";
import type { ShoppingItem } from "../types";
import { loadJson, saveJson } from "../lib/storage";
import { saveUserDataRemote } from "../lib/userData";

const SHOPPING_KEY = "alfred-shopping-list";

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(() =>
    loadJson<ShoppingItem[]>(SHOPPING_KEY, []),
  );

  // Push only real edits made here: not what we just loaded on open, and not
  // a copy that came from another device (that would overwrite newer data).
  const skipPush = useRef(true);
  useEffect(() => {
    saveJson(SHOPPING_KEY, items);
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void saveUserDataRemote({ shoppingList: items }).catch(() => undefined);
    }, 600);
    return () => clearTimeout(timer);
  }, [items]);

  const add = useCallback((name: string, inPantry = false) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => {
      const norm = trimmed.toLowerCase();
      const existing = prev.find((i) => i.name.toLowerCase() === norm);
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, inPantry: inPantry || i.inPantry } : i,
        );
      }
      return [
        {
          id: crypto.randomUUID(),
          name: trimmed,
          inPantry,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  const togglePantry = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, inPantry: !i.inPantry } : i)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearPurchased = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.inPantry));
  }, []);

  const loadRemote = useCallback((remote: ShoppingItem[]) => {
    setItems((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(remote)) return prev;
      skipPush.current = true;
      return remote;
    });
  }, []);

  return { items, add, togglePantry, remove, clearPurchased, loadRemote };
}
