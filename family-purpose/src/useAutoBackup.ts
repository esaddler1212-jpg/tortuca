import { useCallback, useEffect, useRef, useState } from "react";
import type { DebriefSettings } from "./types";
import { loadDebriefSettings } from "./storage";
import { runScheduledBackup } from "./autoBackup";

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
 * Daily 2:30 PM Pacific upload (and optional Downloads on Chromebook).
 * Does not pull other devices into the log — reports merge cloud data when opened.
 */
export function useScheduledBackup(
  settings: DebriefSettings,
  _dataRevision: number,
  onResult: (message: string) => void,
): void {
  const inFlight = useRef(false);

  const runScheduled = useCallback(async () => {
    const current = loadDebriefSettings();
    if (!current.autoBackupEnabled || inFlight.current || !navigator.onLine) {
      return;
    }
    inFlight.current = true;
    try {
      const result = await runScheduledBackup(current);
      if (result.downloaded) {
        onResult("Daily backup saved to Downloads (2:30 PM Pacific)");
      } else if (result.uploaded) {
        onResult("Daily backup uploaded (2:30 PM Pacific)");
      } else if (result.error) {
        onResult(result.error);
      }
    } finally {
      inFlight.current = false;
    }
  }, [onResult]);

  useEffect(() => {
    if (!settings.autoBackupEnabled) return;
    void runScheduled();
    const id = window.setInterval(() => void runScheduled(), 60_000);
    return () => window.clearInterval(id);
  }, [runScheduled, settings.autoBackupEnabled]);
}

/** @deprecated Use useScheduledBackup */
export const useAutoBackupOnReconnect = useScheduledBackup;
