import { useCallback, useEffect, useRef, useState } from "react";
import type { DebriefSettings } from "./types";
import { loadDebriefSettings } from "./storage";
import {
  pullAndMergeFromCloud,
  runScheduledBackup,
} from "./autoBackup";

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
 * On open: pull cloud check-ins only (no file download).
 * Daily at 2:30 PM Pacific: upload and/or Chromebook download when there is new data.
 */
export function useScheduledBackup(
  settings: DebriefSettings,
  onResult: (message: string) => void,
  onDataChange?: () => void,
): void {
  const inFlight = useRef(false);

  const syncPullOnly = useCallback(async () => {
    const current = loadDebriefSettings();
    if (!current.backupUploadUrl.trim() || !navigator.onLine) return;
    const pull = await pullAndMergeFromCloud(current);
    if (pull.error && pull.error.includes("Could not")) {
      onResult(pull.error);
      return;
    }
    if (pull.merged && pull.addedCheckIns) {
      onDataChange?.();
      onResult(
        `Synced ${pull.addedCheckIns} check-in${pull.addedCheckIns === 1 ? "" : "s"} from another device`,
      );
    }
  }, [onDataChange, onResult]);

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
        if (result.merged) {
          onDataChange?.();
          onResult(
            `Daily backup: synced ${result.merged} check-in${result.merged === 1 ? "" : "s"} and uploaded`,
          );
        } else {
          onResult("Daily backup uploaded (2:30 PM Pacific)");
        }
      } else if (result.error) {
        onResult(result.error);
      }
    } finally {
      inFlight.current = false;
    }
  }, [onDataChange, onResult]);

  useEffect(() => {
    void syncPullOnly();
  }, [syncPullOnly]);

  useEffect(() => {
    const onOnline = () => {
      void syncPullOnly();
      window.setTimeout(() => void runScheduled(), 2000);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncPullOnly, runScheduled]);

  useEffect(() => {
    if (!settings.autoBackupEnabled) return;
    void runScheduled();
    const id = window.setInterval(() => void runScheduled(), 60_000);
    return () => window.clearInterval(id);
  }, [runScheduled, settings.autoBackupEnabled]);
}

/** @deprecated Use useScheduledBackup */
export const useAutoBackupOnReconnect = useScheduledBackup;
