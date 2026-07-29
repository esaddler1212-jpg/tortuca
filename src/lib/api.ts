import type {
  MarketingIdea,
  ShopifyOrder,
  StoreMetrics,
  WoodhouseApprovalStatus,
} from "../../shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getMetrics: () => request<StoreMetrics>("/api/metrics"),
  getOrders: () => request<{ orders: ShopifyOrder[] }>("/api/orders"),
  patchOrder: (id: string, status: WoodhouseApprovalStatus) =>
    request<{ order: ShopifyOrder }>(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getMarketing: () => request<{ ideas: MarketingIdea[] }>("/api/marketing"),
  saveMarketing: (ideas: MarketingIdea[]) =>
    request<{ ideas: MarketingIdea[] }>("/api/marketing", {
      method: "PATCH",
      body: JSON.stringify({ ideas }),
    }),
};
