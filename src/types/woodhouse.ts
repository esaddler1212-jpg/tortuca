/** Woodhouse protocol v1 — shared snapshot shape (Easy Supply Co store node). */
export interface WoodhouseSnapshot {
  protocol: "woodhouse/v1";
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

export const WOODHOUSE_PROTOCOL = "woodhouse/v1" as const;

export function isWoodhouseSnapshot(value: unknown): value is WoodhouseSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as WoodhouseSnapshot;
  return v.protocol === WOODHOUSE_PROTOCOL && typeof v.storeName === "string";
}
