import { useEffect, useState } from "react";
import type { DebriefSettings } from "./types";
import { runCloudSync } from "./autoBackup";

export function DeviceSyncHint({ settings }: { settings: DebriefSettings }) {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!settings.backupUploadUrl.trim()) {
    return (
      <div className="device-hint device-hint-alert">
        <strong>Phone + computer not linked yet</strong>
        <p className="hint">
          On both devices, open Settings and paste the same backup upload URL
          and key from Netlify. Check-ins will sync automatically when you are
          online.
        </p>
      </div>
    );
  }

  return (
    <div className="device-hint device-hint-sync">
      <strong>Phone and computer linked</strong>
      <p className="hint">
        {online
          ? "Syncing both ways when you open the app, save a check-in, or every few minutes. Chromebook Downloads only at 2:30 PM Pacific."
          : "Offline — new check-ins stay on this device until you reconnect."}
      </p>
    </div>
  );
}

export function SyncNowButton({
  settings,
  onMessage,
  onDataChange,
}: {
  settings: DebriefSettings;
  onMessage: (msg: string) => void;
  onDataChange: () => void;
}) {
  const [busy, setBusy] = useState(false);

  if (!settings.backupUploadUrl.trim()) return null;

  const sync = async () => {
    setBusy(true);
    try {
      const result = await runCloudSync(settings);
      if (result.error) {
        onMessage(result.error);
      } else if (result.merged) {
        onDataChange();
        onMessage(
          `Synced ${result.merged} check-in${result.merged === 1 ? "" : "s"} from the cloud`,
        );
      } else if (result.uploaded) {
        onMessage("Synced with cloud — your check-ins are uploaded");
      } else {
        onMessage("Already up to date with the cloud");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary"
      disabled={busy || !navigator.onLine}
      onClick={() => void sync()}
    >
      {busy ? "Syncing…" : "Sync phone and computer now"}
    </button>
  );
}
