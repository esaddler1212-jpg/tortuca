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
      const sub = await subscribeToPush();
      if (!sub) {
        setError("Push notifications unavailable. Add VAPID keys on Netlify.");
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
