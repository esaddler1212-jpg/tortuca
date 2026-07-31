import { useOnlineStatus } from "./useAutoBackup";

export default function ConnectivityBanner({ online }: { online: boolean }) {
  if (online) return null;

  return (
    <div className="connectivity-banner" role="status">
      <strong>Offline</strong>
      <span className="hint">
        Check-ins are saved on this Chromebook. When you connect your hotspot,
        new data will back up automatically.
      </span>
    </div>
  );
}

export function ConnectivityBannerLive() {
  const online = useOnlineStatus();
  return <ConnectivityBanner online={online} />;
}
