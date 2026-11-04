import { useCallback, useEffect, useState } from "react";
import type { UserSettings } from "../types";
import { authHeaders, ensureSession } from "../lib/google";
import { onRemoteData } from "../lib/remoteSync";
import { commuteMinutesFor, type LiveCommute } from "../../shared/commute";

interface CommuteStatus {
  configured: boolean;
  hasAddresses: boolean;
  live: LiveCommute | null;
}

/**
 * Commute minutes for leave-by. Live traffic is fetched by the server on school
 * mornings (netlify/functions/commute-scheduled.ts) and saved to your account;
 * this just reads it. No device asks Google, and nothing nags: without live
 * data it quietly uses your usual minutes from Settings.
 */
export function useCommute(settings: UserSettings, signedIn: boolean) {
  const [status, setStatus] = useState<CommuteStatus | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(
    async (refresh = false) => {
      if (!signedIn) return;
      try {
        await ensureSession();
        const res = await fetch("/api/commute", { method: refresh ? "POST" : "GET", headers: authHeaders() });
        if (res.ok) setStatus((await res.json()) as CommuteStatus);
      } catch {
        /* offline: usual minutes */
      }
    },
    [signedIn],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // New live numbers arrive with the account data; re-check freshness each minute.
  useEffect(
    () =>
      onRemoteData((data) => {
        if (data.liveCommute) setStatus((s) => ({ configured: s?.configured ?? true, hasAddresses: s?.hasAddresses ?? true, live: data.liveCommute ?? null }));
      }),
    [],
  );
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const effectiveMinutes = commuteMinutesFor(settings, status?.live, now);
  const usingLive = settings.useLiveCommute && effectiveMinutes !== settings.commuteMinutes;
  return { effectiveMinutes, usingLive, live: status?.live ?? null, configured: status?.configured ?? null, hasAddresses: status?.hasAddresses ?? null, refresh: () => load(true) };
}
