import type { Handler } from "@netlify/functions";

const WOODHOUSE_PROTOCOL = "woodhouse/v1" as const;

interface WoodhouseSnapshot {
  protocol: typeof WOODHOUSE_PROTOCOL;
  storeId: string;
  storeName: string;
  generatedAt: string;
  metrics: {
    monthToDateRevenue: number;
    monthToDateOrders: number;
    goalProgressPercent: number;
    pendingApprovals: number;
  };
  pendingOrderIds: string[];
  priorityActions: string[];
}

function demoSnapshot(): WoodhouseSnapshot {
  return {
    protocol: WOODHOUSE_PROTOCOL,
    storeId: process.env.SHOPIFY_STORE_DOMAIN ?? "easy-supply-co-demo",
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

function nodeUrl(event: { headers: Record<string, string | undefined> }): string | null {
  const fromEnv = process.env.WOODHOUSE_EASY_SUPPLY_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromHeader = event.headers["x-woodhouse-node-url"] ?? event.headers["X-Woodhouse-Node-Url"];
  if (fromHeader?.trim()) return fromHeader.trim().replace(/\/$/, "");
  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const base = nodeUrl(event);
  if (!base) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Woodhouse-Source": "demo",
      },
      body: JSON.stringify(demoSnapshot()),
    };
  }

  try {
    const res = await fetch(`${base}/api/woodhouse/snapshot`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Woodhouse node returned ${res.status}`,
          node: base,
        }),
      };
    }
    const body = await res.text();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Woodhouse-Source": "proxy",
      },
      body,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: message, node: base }),
    };
  }
};
