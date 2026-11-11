import { useOnlineStatus } from "./useAutoBackup";

export default function ConnectivityBanner({ online }: { online: boolean }) {
  if (online) return null;

  return (
    <div className="connectivity-banner" role="status">
      <strong>Offline</strong>
      <span className="hint">
        Check-ins are saved on this device. Debrief and weekly reports pull from
        all devices when online. Upload runs at 2:30 PM Pacific — not on every open.
      </span>
    </div>
  );
}

export function ConnectivityBannerLive() {
  const online = useOnlineStatus();
  return <ConnectivityBanner online={online} />;
}
