import { useEffect, useState } from "react";
import type { DebriefSettings } from "./types";
import { runUploadNow } from "./autoBackup";

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
          and key from Netlify. Each device uploads at 2:30 PM Pacific; debrief
          and weekly reports pull everyone&apos;s check-ins when you open them.
        </p>
      </div>
    );
  }

  return (
    <div className="device-hint device-hint-sync">
      <strong>Phone and computer linked</strong>
      <p className="hint">
        {online
          ? "This device uploads at 2:30 PM Pacific. Debrief and weekly summary include check-ins from all devices when online."
          : "Offline — check-ins stay on this device until you reconnect. Reports show this device only until the cloud is reachable."}
      </p>
    </div>
  );
}

export function SyncNowButton({
  settings,
  onMessage,
}: {
  settings: DebriefSettings;
  onMessage: (msg: string) => void;
  onDataChange?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  if (!settings.backupUploadUrl.trim()) return null;

  const upload = async () => {
    setBusy(true);
    try {
      const result = await runUploadNow(settings);
      if (result.error) {
        onMessage(result.error);
      } else if (result.uploaded) {
        onMessage("Uploaded this device's check-ins to the cloud");
      } else {
        onMessage("Nothing to upload");
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
      onClick={() => void upload()}
    >
      {busy ? "Uploading…" : "Upload this device now"}
    </button>
  );
}
