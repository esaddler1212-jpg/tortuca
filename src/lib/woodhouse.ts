import type { WoodhouseSnapshot } from "../types/woodhouse";
import { isWoodhouseSnapshot, WOODHOUSE_PROTOCOL } from "../types/woodhouse";
import { loadSettings } from "./storage";

function apiBase(): string {
  return "/api";
}

export function demoWoodhouseSnapshot(): WoodhouseSnapshot {
  return {
    protocol: WOODHOUSE_PROTOCOL,
    storeId: "easy-supply-co-demo",
    storeName: "Easy Supply Co. (demo)",
    generatedAt: new Date().toISOString(),
    metrics: {
      monthToDateRevenue: 2840,
      monthToDateOrders: 18,
      goalProgressPercent: 57,
      pendingApprovals: 2,
    },
    pendingOrderIds: ["demo-1001", "demo-1002"],
    priorityActions: [
      "Approve 2 pending Shopify orders",
      "Close $2160 gap to $5000/mo goal",
    ],
  };
}

export async function fetchWoodhouseSnapshot(): Promise<{
  snapshot: WoodhouseSnapshot;
  source: "live" | "demo" | "proxy";
}> {
  const settings = loadSettings();
  const headers: HeadersInit = {};
  if (settings.woodhouseNodeUrl.trim()) {
    headers["X-Woodhouse-Node-Url"] = settings.woodhouseNodeUrl.trim().replace(/\/$/, "");
  }

  try {
    const res = await fetch(`${apiBase()}/woodhouse`, { headers });
    if (res.ok) {
      const body: unknown = await res.json();
      if (isWoodhouseSnapshot(body)) {
        const source = res.headers.get("X-Woodhouse-Source") === "demo" ? "demo" : "proxy";
        return { snapshot: body, source };
      }
    }
  } catch {
    /* Netlify Functions unavailable in plain Vite dev */
  }

  if (settings.woodhouseNodeUrl.trim()) {
    try {
      const url = `${settings.woodhouseNodeUrl.trim().replace(/\/$/, "")}/api/woodhouse/snapshot`;
      const res = await fetch(url);
      if (res.ok) {
        const body: unknown = await res.json();
        if (isWoodhouseSnapshot(body)) {
          return { snapshot: body, source: "live" };
        }
      }
    } catch {
      /* CORS or network */
    }
  }

  return { snapshot: demoWoodhouseSnapshot(), source: "demo" };
}
