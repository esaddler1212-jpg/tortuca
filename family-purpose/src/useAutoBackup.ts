import { useCallback, useEffect, useRef, useState } from "react";
import type { DebriefSettings } from "./types";
import { loadDebriefSettings } from "./storage";
import { needsBackup, runAutoBackup } from "./autoBackup";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}

/**
 * Backs up when the device comes back online, or on first load if there is
 * already new data and a connection (e.g. you logged offline and opened the
 * app on your phone hotspot).
 */
export function useAutoBackupOnReconnect(
  settings: DebriefSettings,
  onResult: (message: string) => void,
): void {
  const inFlight = useRef(false);
  const sawOffline = useRef(!navigator.onLine);

  const attempt = useCallback(async () => {
    const current = loadDebriefSettings();
    if (!current.autoBackupEnabled || !needsBackup()) return;
    if (inFlight.current) return;
    if (!navigator.onLine) return;

    inFlight.current = true;
    try {
      const result = await runAutoBackup(current);
      if (result.downloaded) {
        onResult("Backup saved to Downloads — new check-ins are backed up");
      } else if (result.uploaded) {
        onResult("Backup uploaded — new check-ins are saved off this Chromebook");
      } else if (result.error) {
        onResult(result.error);
      }
    } finally {
      inFlight.current = false;
    }
  }, [onResult]);

  useEffect(() => {
    const onOnline = () => {
      if (sawOffline.current) {
        sawOffline.current = false;
        window.setTimeout(() => void attempt(), 1500);
      }
    };
    const onOffline = () => {
      sawOffline.current = true;
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [attempt]);

  useEffect(() => {
    if (!navigator.onLine || !settings.autoBackupEnabled) return;
    if (!needsBackup()) return;
    const timer = window.setTimeout(() => void attempt(), 2000);
    return () => window.clearTimeout(timer);
  }, [attempt, settings.autoBackupEnabled]);
}
