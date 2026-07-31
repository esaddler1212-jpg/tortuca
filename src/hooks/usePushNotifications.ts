import { useCallback, useState } from "react";
import { savePushSubscription, subscribeToPush } from "../lib/userData";

export function usePushNotifications(enabled: boolean) {
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setSubscribed(false);
  }, []);

  return { subscribed: enabled && subscribed, error, loading, enable, disable };
}
