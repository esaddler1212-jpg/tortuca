import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { UserSettings, TodoItem, FitnessLog, ShoppingItem } from "../types";
import { fetchUserData, syncSettings, syncTodos } from "../lib/userData";
import { saveJson, TODOS_KEY } from "../lib/storage";

export function useUserDataSync(
  settings: UserSettings,
  persist: (next: UserSettings) => void,
  todos: TodoItem[],
  setTodos: Dispatch<SetStateAction<TodoItem[]>>,
  onFitnessLoad?: (logs: FitnessLog[]) => void,
  onShoppingLoad?: (items: ShoppingItem[]) => void,
) {
  const [synced, setSynced] = useState(false);
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(false);

  useEffect(() => {
    if (initialLoad.current) return;
    initialLoad.current = true;
    void (async () => {
      const remote = await fetchUserData();
      if (!remote) return;
      if (remote.todos?.length) {
        setTodos(remote.todos);
        saveJson(TODOS_KEY, remote.todos);
      }
      if (remote.settings) {
        persist({ ...settings, ...remote.settings });
      }
      if (remote.fitnessLogs?.length) {
        onFitnessLoad?.(remote.fitnessLogs);
      }
      if (remote.shoppingList?.length) {
        onShoppingLoad?.(remote.shoppingList);
      }
      setSynced(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoad.current) return;
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => {
      void syncSettings(settings);
    }, 800);
    return () => {
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
  }, [settings]);

  useEffect(() => {
    if (!initialLoad.current) return;
    if (todosTimer.current) clearTimeout(todosTimer.current);
    todosTimer.current = setTimeout(() => {
      void syncTodos(todos);
    }, 600);
    return () => {
      if (todosTimer.current) clearTimeout(todosTimer.current);
    };
  }, [todos]);

  const forceSync = useCallback(async () => {
    await syncSettings(settings);
    await syncTodos(todos);
    setSynced(true);
  }, [settings, todos]);

  return { synced, forceSync };
}
