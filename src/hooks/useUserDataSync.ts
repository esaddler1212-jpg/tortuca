import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { UserSettings, TodoItem, FitnessLog, ShoppingItem } from "../types";
import { fetchUserData, syncSettings, syncTodos } from "../lib/userData";
import { saveJson, TODOS_KEY } from "../lib/storage";
import { onRemoteData, startRemoteSync } from "../lib/remoteSync";
import { toSyncedSettings } from "../lib/userData";

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
  const started = useRef(false);
  const skipTodosEcho = useRef(false);
  const skipSettingsEcho = useRef(false);
  const latest = useRef({ settings, todos, persist, onFitnessLoad, onShoppingLoad });
  latest.current = { settings, todos, persist, onFitnessLoad, onShoppingLoad };

  // Changes made on another device while this one is open (see lib/remoteSync).
  useEffect(() => {
    startRemoteSync();
    return onRemoteData((remote) => {
      const cur = latest.current;
      if (remote.todos && !todosTimer.current && JSON.stringify(remote.todos) !== JSON.stringify(cur.todos)) {
        skipTodosEcho.current = true;
        setTodos(remote.todos);
        saveJson(TODOS_KEY, remote.todos);
      }
      if (remote.settings && !settingsTimer.current && JSON.stringify(remote.settings) !== JSON.stringify(toSyncedSettings(cur.settings))) {
        skipSettingsEcho.current = true;
        cur.persist({ ...cur.settings, ...remote.settings });
      }
      if (remote.fitnessLogs) cur.onFitnessLoad?.(remote.fitnessLogs);
      if (remote.shoppingList) cur.onShoppingLoad?.(remote.shoppingList);
    });
  }, [setTodos]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      // Don't push anything until the server's copy has been read (or failed).
      const remote = await fetchUserData().catch(() => null);
      initialLoad.current = true;
      if (!remote) return;
      if (remote.todos?.length) {
        skipTodosEcho.current = true;
        setTodos(remote.todos);
        saveJson(TODOS_KEY, remote.todos);
      }
      if (remote.settings) {
        skipSettingsEcho.current = true;
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
    if (skipSettingsEcho.current) {
      skipSettingsEcho.current = false;
      return;
    }
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => {
      settingsTimer.current = null;
      void syncSettings(settings);
    }, 800);
    return () => {
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
  }, [settings]);

  useEffect(() => {
    if (!initialLoad.current) return;
    if (skipTodosEcho.current) {
      skipTodosEcho.current = false;
      return;
    }
    if (todosTimer.current) clearTimeout(todosTimer.current);
    todosTimer.current = setTimeout(() => {
      todosTimer.current = null;
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
