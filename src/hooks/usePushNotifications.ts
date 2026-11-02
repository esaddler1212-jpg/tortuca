import { useCallback, useEffect, useState } from "react";
import { fetchUserData, savePushSubscription, subscribeToPush, saveUserDataRemote } from "../lib/userData";

export function usePushNotifications(enabled: boolean) {
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSubscribed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [data, reg] = await Promise.all([
          fetchUserData(),
          "serviceWorker" in navigator
            ? navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription())
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setSubscribed(Boolean(data?.pushSubscription && reg));
      } catch {
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // iPhone/iPad only allow web push for apps opened from the Home Screen (iOS 16.4+).
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (isIos && !standalone) {
        setError(
          "On iPhone, add IRIS to your Home Screen first (Safari → Share → Add to Home Screen), open it from there, then turn on notifications.",
        );
        return false;
      }
      if (!("PushManager" in window)) {
        setError("This browser doesn't support push notifications. On iPhone, update to iOS 16.4 or later.");
        return false;
      }
      const sub = await subscribeToPush();
      if (!sub) {
        setError(
          typeof Notification !== "undefined" && Notification.permission === "denied"
            ? "Notifications are blocked. On iPhone: Settings → Notifications → IRIS → Allow."
            : "Push notifications unavailable. Add VAPID keys on Netlify.",
        );
        return false;
      }
      await savePushSubscription(sub);
      setSubscribed(true);
      return true;
    } catch {
      setError("Could not enable push notifications.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await saveUserDataRemote({ pushSubscription: null });
      setSubscribed(false);
    } catch {
      setError("Could not disable push notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscribed: enabled && subscribed, error, loading, enable, disable };
}
