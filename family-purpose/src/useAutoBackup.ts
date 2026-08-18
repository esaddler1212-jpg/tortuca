import { useCallback, useEffect, useRef, useState } from "react";
import type { DebriefSettings } from "./types";
import { loadDebriefSettings } from "./storage";
import { runCloudSync, runScheduledBackup } from "./autoBackup";

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

const SYNC_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Phone ↔ computer: pull + upload when online (open, reconnect, after edits).
 * Chromebook Downloads file only at 2:30 PM Pacific when enabled.
 */
export function useScheduledBackup(
  settings: DebriefSettings,
  dataRevision: number,
  onResult: (message: string) => void,
  onDataChange?: () => void,
): void {
  const inFlight = useRef(false);

  const cloudSync = useCallback(async () => {
    const current = loadDebriefSettings();
    if (!current.backupUploadUrl.trim() || !navigator.onLine) return;
    if (inFlight.current) return;

    inFlight.current = true;
    try {
      const result = await runCloudSync(current);
      if (result.error) {
        onResult(result.error);
        return;
      }
      if (result.merged) {
        onDataChange?.();
        onResult(
          `Synced ${result.merged} check-in${result.merged === 1 ? "" : "s"} from another device`,
        );
      }
    } finally {
      inFlight.current = false;
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
    void cloudSync();
  }, [cloudSync]);

  useEffect(() => {
    if (!settings.backupUploadUrl.trim() || dataRevision === 0) return;
    const timer = window.setTimeout(() => void cloudSync(), 1500);
    return () => window.clearTimeout(timer);
  }, [dataRevision, cloudSync, settings.backupUploadUrl]);

  useEffect(() => {
    const onOnline = () => {
      window.setTimeout(() => void cloudSync(), 1500);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [cloudSync]);

  useEffect(() => {
    if (!settings.backupUploadUrl.trim()) return;
    const id = window.setInterval(() => void cloudSync(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [cloudSync, settings.backupUploadUrl]);

  useEffect(() => {
    if (!settings.backupUploadUrl.trim()) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void cloudSync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [cloudSync, settings.backupUploadUrl]);

  useEffect(() => {
    if (!settings.autoBackupEnabled) return;
    void runScheduled();
    const id = window.setInterval(() => void runScheduled(), 60_000);
    return () => window.clearInterval(id);
  }, [runScheduled, settings.autoBackupEnabled]);
}

/** @deprecated Use useScheduledBackup */
export const useAutoBackupOnReconnect = useScheduledBackup;
