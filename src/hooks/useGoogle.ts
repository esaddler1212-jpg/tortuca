import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "../types";
import { LOCAL_EVENTS_KEY, loadJson, saveJson } from "../lib/storage";
import {
  disconnectGoogle,
  fetchCalendarEvents,
  fetchGoogleStatus,
  startGoogleConnect,
} from "../lib/google";

export function useGoogleIntegration() {
  const [connected, setConnected] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchGoogleStatus();
      setConnected(status.connected);
      setAccountEmail(status.email);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      void refreshStatus();
    }
  }, [refreshStatus]);

  const connect = useCallback(() => {
    void startGoogleConnect();
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectGoogle();
    setConnected(false);
    setAccountEmail(undefined);
  }, []);

  return {
    connected,
    accountEmail,
    loading,
    connect,
    disconnect,
    refreshStatus,
  };
}

export function useSchedule(googleConnected: boolean) {
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(() =>
    loadJson<CalendarEvent[]>(LOCAL_EVENTS_KEY, []),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGoogle = useCallback(async () => {
    if (!googleConnected) {
      setGoogleEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const events = await fetchCalendarEvents();
      setGoogleEvents(events);
    } catch {
      setError("Could not load Google Calendar.");
    } finally {
      setLoading(false);
    }
  }, [googleConnected]);

  useEffect(() => {
    void refreshGoogle();
  }, [refreshGoogle]);

  useEffect(() => {
    saveJson(LOCAL_EVENTS_KEY, localEvents);
  }, [localEvents]);

  const addLocalEvent = useCallback(
    (title: string, start: string, end?: string) => {
      setLocalEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          title,
          start,
          end,
          source: "local",
        },
      ]);
    },
    [],
  );

  const removeLocalEvent = useCallback((id: string) => {
    setLocalEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const allEvents = [...googleEvents, ...localEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const upcoming = allEvents.filter((e) => new Date(e.start) >= new Date());

  return {
    allEvents: upcoming.slice(0, 12),
    loading,
    error,
    addLocalEvent,
    removeLocalEvent,
    refreshGoogle,
    localEvents,
  };
}
