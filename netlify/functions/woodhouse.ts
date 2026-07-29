import type { Handler } from "@netlify/functions";
import {
  buildFamilyPurposeWoodhouseNode,
  demoFamilyPurposeNode,
  type FpBackup,
} from "./_family-purpose-woodhouse";
import { getStore } from "@netlify/blobs";

const WOODHOUSE_V2 = "woodhouse/v2" as const;

interface WoodhouseStoreNode {
  storeId: string;
  storeName: string;
  metrics: {
    monthToDateRevenue: number;
    monthToDateOrders: number;
    goalProgressPercent: number;
    pendingApprovals: number;
  };
  pendingOrderIds: string[];
  priorityActions: string[];
}

interface WoodhouseSnapshotV2 {
  protocol: typeof WOODHOUSE_V2;
  generatedAt: string;
  store: WoodhouseStoreNode | null;
  familyPurpose: ReturnType<typeof buildFamilyPurposeWoodhouseNode> | null;
  priorityActions: string[];
}

function demoStore(): WoodhouseStoreNode {
  return {
    storeId: "easy-supply-co-demo",
    storeName: "Easy Supply Co. (demo)",
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

function storeUrl(event: { headers: Record<string, string | undefined> }): string | null {
  const fromEnv = process.env.WOODHOUSE_EASY_SUPPLY_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromHeader = event.headers["x-woodhouse-node-url"] ?? event.headers["X-Woodhouse-Node-Url"];
  if (fromHeader?.trim()) return fromHeader.trim().replace(/\/$/, "");
  return null;
}

function familyUrl(event: { headers: Record<string, string | undefined> }): string | null {
  const fromEnv = process.env.WOODHOUSE_FAMILY_PURPOSE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromHeader =
    event.headers["x-woodhouse-family-url"] ?? event.headers["X-Woodhouse-Family-Url"];
  if (fromHeader?.trim()) return fromHeader.trim().replace(/\/$/, "");
  return null;
}

async function fetchStoreNode(
  base: string,
): Promise<WoodhouseStoreNode | null> {
  const res = await fetch(`${base}/api/woodhouse/snapshot`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as {
    storeId?: string;
    storeName?: string;
    metrics?: WoodhouseStoreNode["metrics"];
    pendingOrderIds?: string[];
    priorityActions?: string[];
    store?: WoodhouseStoreNode;
  };
  if (raw.store) return raw.store;
  if (raw.storeName && raw.metrics) {
    return {
      storeId: raw.storeId ?? "store",
      storeName: raw.storeName,
      metrics: raw.metrics,
      pendingOrderIds: raw.pendingOrderIds ?? [],
      priorityActions: raw.priorityActions ?? [],
    };
  }
  return null;
}

async function fetchFamilyNode(
  base: string,
): Promise<ReturnType<typeof buildFamilyPurposeWoodhouseNode> | null> {
  const res = await fetch(`${base}/api/woodhouse/snapshot`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return (await res.json()) as ReturnType<typeof buildFamilyPurposeWoodhouseNode>;
}

async function familyFromBackup(): Promise<ReturnType<typeof buildFamilyPurposeWoodhouseNode> | null> {
  try {
    const store = getStore({ name: "family-purpose-backups", consistency: "strong" });
    const { blobs } = await store.list();
    if (!blobs.length) return null;
    const sorted = [...blobs].sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
    );
    const data = await store.get(sorted[0].key, { type: "json" });
    if (!data || typeof data !== "object") return null;
    const backup = data as FpBackup;
    if (!Array.isArray(backup.checkIns)) return null;
    const timeZone = process.env.WOODHOUSE_TIMEZONE?.trim() || "America/Los_Angeles";
    return buildFamilyPurposeWoodhouseNode(backup, new Date(), timeZone);
  } catch {
    return null;
  }
}

function mergeActions(store: WoodhouseStoreNode | null, family: ReturnType<typeof buildFamilyPurposeWoodhouseNode> | null): string[] {
  const actions = [
    ...(store?.priorityActions ?? []),
    ...(family?.priorityActions ?? []),
  ];
  return [...new Set(actions)];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const storeBase = storeUrl(event);
  const familyBase = familyUrl(event);
  const useDemo = !storeBase && !familyBase;

  let store: WoodhouseStoreNode | null = null;
  let family: ReturnType<typeof buildFamilyPurposeWoodhouseNode> | null = null;
  let source = "demo";

  if (storeBase) {
    store = await fetchStoreNode(storeBase);
    if (store) source = "proxy";
  } else if (useDemo) {
    store = demoStore();
  }

  if (familyBase) {
    family = await fetchFamilyNode(familyBase);
    if (family) source = "proxy";
  } else {
    const fromBackup = await familyFromBackup();
    if (fromBackup) {
      family = fromBackup;
      source = source === "proxy" ? "proxy" : "backup";
    } else if (useDemo) {
      family = demoFamilyPurposeNode();
    }
  }

  const snapshot: WoodhouseSnapshotV2 = {
    protocol: WOODHOUSE_V2,
    generatedAt: new Date().toISOString(),
    store,
    familyPurpose: family,
    priorityActions: mergeActions(store, family),
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Woodhouse-Source": source,
    },
    body: JSON.stringify(snapshot),
  };
};
