import {
  defaultMarketingIdeas,
  fetchOrders,
  fetchStoreMetrics,
  setOrderApproval,
} from "./shopify";
import type { MarketingIdea, WoodhouseApprovalStatus, WoodhouseSnapshot } from "./types";
import { MONTHLY_SALES_GOAL } from "./types";

const marketingStore = new Map<string, MarketingIdea[]>();

export async function handleApiRequest(
  method: string,
  pathname: string,
  body?: string,
): Promise<{ status: number; body: unknown }> {
  const parts = pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
  const resource = parts[0] ?? "";
  const sub = parts[1] ?? "";

  if (resource === "metrics" && method === "GET") {
    return { status: 200, body: await fetchStoreMetrics() };
  }

  if (resource === "orders" && method === "GET") {
    return { status: 200, body: { orders: await fetchOrders() } };
  }

  if (resource === "orders" && sub && method === "PATCH") {
    const parsed = JSON.parse(body ?? "{}") as { status?: WoodhouseApprovalStatus };
    if (!parsed.status || !["pending", "approved", "held"].includes(parsed.status)) {
      return { status: 400, body: { error: "status must be pending, approved, or held" } };
    }
    const order = await setOrderApproval(sub, parsed.status);
    return { status: 200, body: { order } };
  }

  if (resource === "marketing" && method === "GET") {
    const key = "default";
    if (!marketingStore.has(key)) marketingStore.set(key, defaultMarketingIdeas());
    return { status: 200, body: { ideas: marketingStore.get(key)! } };
  }

  if (resource === "marketing" && method === "PATCH") {
    const parsed = JSON.parse(body ?? "{}") as { ideas?: MarketingIdea[] };
    if (!parsed.ideas) return { status: 400, body: { error: "ideas array required" } };
    marketingStore.set("default", parsed.ideas);
    return { status: 200, body: { ideas: parsed.ideas } };
  }

  if (resource === "woodhouse" && sub === "snapshot" && method === "GET") {
    const [metrics, orders] = await Promise.all([fetchStoreMetrics(), fetchOrders()]);
    const snapshot: WoodhouseSnapshot = {
      protocol: "woodhouse/v1",
      storeId: process.env.SHOPIFY_STORE_DOMAIN ?? "easy-supply-co-demo",
      storeName: metrics.shopName,
      generatedAt: new Date().toISOString(),
      metrics: {
        monthToDateRevenue: metrics.monthToDateRevenue,
        monthToDateOrders: metrics.monthToDateOrders,
        goalProgressPercent: metrics.goalProgressPercent,
        pendingApprovals: metrics.pendingApprovals,
      },
      pendingOrderIds: orders
        .filter((o) => o.woodhouseApproval === "pending")
        .map((o) => o.id),
      priorityActions: [
        ...metrics.health.filter((h) => h.severity === "action").map((h) => h.title),
        metrics.revenueToGoal > 0
          ? `Close $${Math.round(metrics.revenueToGoal)} gap to $${MONTHLY_SALES_GOAL}/mo goal`
          : "Maintain momentum — goal within reach",
      ],
    };
    return { status: 200, body: snapshot };
  }

  return { status: 404, body: { error: "Not found" } };
}
