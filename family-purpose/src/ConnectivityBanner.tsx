import { useOnlineStatus } from "./useAutoBackup";

export default function ConnectivityBanner({ online }: { online: boolean }) {
  if (online) return null;

  return (
    <div className="connectivity-banner" role="status">
      <strong>Offline</strong>
      <span className="hint">
        Check-ins are saved on this device. Opening the app syncs from the cloud
        when online. Full backup runs at 2:30 PM Pacific — not on every open.
      </span>
    </div>
  );
}

export function ConnectivityBannerLive() {
  const online = useOnlineStatus();
  return <ConnectivityBanner online={online} />;
}
