import { useEffect, useState } from "react";
import type { DebriefSettings } from "./types";
import { pullAndMergeFromCloud } from "./autoBackup";

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
      <div className="device-hint">
        <strong>Phone + computer</strong>
        <p className="hint">
          Install this app on your phone from the same Netlify link. Add the
          backup upload URL and key on both devices so check-ins sync when you
          are online.
        </p>
      </div>
    );
  }

  return (
    <div className="device-hint device-hint-sync">
      <strong>Sync enabled</strong>
      <p className="hint">
        {online
          ? "Opening the app pulls check-ins from the cloud. Full backup runs once daily at 2:30 PM Pacific."
          : "Offline now — new entries stay on this device until you reconnect."}
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
      const result = await pullAndMergeFromCloud(settings);
      if (result.error) {
        onMessage(result.error);
      } else if (result.merged && result.addedCheckIns) {
        onDataChange();
        onMessage(
          `Synced ${result.addedCheckIns} check-in${result.addedCheckIns === 1 ? "" : "s"} from the cloud`,
        );
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
      {busy ? "Syncing…" : "Sync from cloud now"}
    </button>
  );
}
