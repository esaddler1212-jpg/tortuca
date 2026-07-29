/** Woodhouse protocol — orchestration snapshots for Alfred and store nodes. */

export const WOODHOUSE_V1 = "woodhouse/v1" as const;
export const WOODHOUSE_V2 = "woodhouse/v2" as const;

export interface WoodhouseStoreNode {
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

export type WoodhouseCalendarKind =
  | "group_meeting"
  | "follow_up_due"
  | "follow_up_overdue"
  | "check_in_today"
  | "school_day";

export interface WoodhouseCalendarItem {
  id: string;
  kind: WoodhouseCalendarKind;
  title: string;
  /** ISO timestamp when known; otherwise start of local day. */
  start: string;
  end?: string;
  detail?: string;
}

export interface WoodhouseFamilyPurposeNode {
  nodeId: string;
  appName: string;
  schoolName: string;
  groupName: string;
  /** Local calendar day YYYY-MM-DD */
  day: string;
  schoolDay: {
    isSchoolDay: boolean;
    label: string;
  };
  stats: {
    checkInsToday: number;
    followUpsDueToday: number;
    followUpsOverdue: number;
    groupMeetingsToday: number;
  };
  calendar: WoodhouseCalendarItem[];
  priorityActions: string[];
}

/** @deprecated Store-only v1 payload; prefer WoodhouseSnapshotV2 */
export interface WoodhouseSnapshotV1 {
  protocol: typeof WOODHOUSE_V1;
  storeId: string;
  storeName: string;
  generatedAt: string;
  metrics: WoodhouseStoreNode["metrics"];
  pendingOrderIds: string[];
  priorityActions: string[];
}

export interface WoodhouseSnapshotV2 {
  protocol: typeof WOODHOUSE_V2;
  generatedAt: string;
  store: WoodhouseStoreNode | null;
  familyPurpose: WoodhouseFamilyPurposeNode | null;
  /** Merged actions from all connected nodes */
  priorityActions: string[];
}

export type WoodhouseSnapshot = WoodhouseSnapshotV2 | WoodhouseSnapshotV1;

export function isWoodhouseSnapshotV2(value: unknown): value is WoodhouseSnapshotV2 {
  if (!value || typeof value !== "object") return false;
  return (value as WoodhouseSnapshotV2).protocol === WOODHOUSE_V2;
}

export function isWoodhouseSnapshot(value: unknown): value is WoodhouseSnapshot {
  if (!value || typeof value !== "object") return false;
  const p = (value as { protocol?: string }).protocol;
  return p === WOODHOUSE_V1 || p === WOODHOUSE_V2;
}

/** Normalize v1 store payloads into v2. */
export function upgradeWoodhouseSnapshot(raw: WoodhouseSnapshot): WoodhouseSnapshotV2 {
  if (isWoodhouseSnapshotV2(raw)) return raw;
  return {
    protocol: WOODHOUSE_V2,
    generatedAt: raw.generatedAt,
    store: {
      storeId: raw.storeId,
      storeName: raw.storeName,
      metrics: raw.metrics,
      pendingOrderIds: raw.pendingOrderIds,
      priorityActions: raw.priorityActions,
    },
    familyPurpose: null,
    priorityActions: raw.priorityActions,
  };
}
