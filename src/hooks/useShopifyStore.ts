import { useCallback, useEffect, useState } from "react";
import { authHeaders, ensureSession } from "../lib/google";
import type { ShopifyStoreSnapshot } from "../../shared/shopify";

export function useShopifyStore(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<ShopifyStoreSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      await ensureSession();
      const res = await fetch("/api/shopify-store", { headers: authHeaders() });
      if (!res.ok) throw new Error("Couldn't load Shopify snapshot.");
      setSnapshot((await res.json()) as ShopifyStoreSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Shopify unavailable");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { snapshot, loading, error, reload };
}
