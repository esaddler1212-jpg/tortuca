import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "../types";
import { LOCAL_EVENTS_KEY, loadJson, saveJson } from "../lib/storage";
import {
  disconnectGoogle,
  fetchCalendarEvents,
  fetchGoogleStatus,
  startGoogleConnect,
} from "../lib/google";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  denied: "Google sign-in was cancelled or your account isn't on the OAuth test-user list. In Google Cloud → OAuth consent screen, add your Gmail under Test users.",
  missing: "Google didn't return an authorization code. Try Connect again.",
  state: "Session expired during sign-in. Tap Connect Google again.",
  redirect:
    "Redirect URI mismatch. In Google Cloud → Credentials → your Web client, add the exact URI shown in Settings (must match character-for-character, including https).",
  client:
    "Invalid Google client ID or secret. Double-check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Netlify, then redeploy.",
  token:
    "Google rejected the token exchange. Usually wrong client secret or redirect URI — verify both in Google Cloud and Netlify, then redeploy.",
};

function oauthErrorMessage(code: string | null): string {
  if (code && OAUTH_ERROR_MESSAGES[code]) return OAUTH_ERROR_MESSAGES[code];
  return "Google sign-in did not complete. Open Settings → Google account for the setup checklist.";
}

export function useGoogleIntegration() {
  const [connected, setConnected] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchGoogleStatus();
      setConnected(status.connected);
      setAccountEmail(status.email);
      if (status.connected) setConnectionError(null);
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
    if (params.get("connected") === "0") {
      const oauthError = params.get("oauth_error");
      window.history.replaceState({}, "", window.location.pathname);
      setConnectionError(oauthErrorMessage(oauthError));
    }
  }, [refreshStatus]);

  const connect = useCallback(async () => {
    setConnectionError(null);
    const result = await startGoogleConnect();
    if (!result.ok && result.error) {
      setConnectionError(result.error);
    }
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
    connectionError,
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
