/**
 * Woodhouse protocol — connection contract between your apps and Alfred.
 *
 * Each app implements GET /api/woodhouse/snapshot returning WoodhouseNodeSnapshot.
 * Alfred aggregates registered nodes into WoodhouseOrchestrationSnapshot.
 */

export const WOODHOUSE_NODE = "woodhouse/node/v1" as const;
export const WOODHOUSE_ORCHESTRATION = "woodhouse/v3" as const;

/** Legacy */
export const WOODHOUSE_V1 = "woodhouse/v1" as const;
export const WOODHOUSE_V2 = "woodhouse/v2" as const;

export type WoodhouseNodeStatus = "ok" | "degraded" | "error" | "offline";

export type WoodhouseCalendarKind =
  | "meeting"
  | "task"
  | "reminder"
  | "group_meeting"
  | "follow_up_due"
  | "follow_up_overdue"
  | "check_in_today"
  | "school_day"
  | string;

export interface WoodhouseCalendarItem {
  id: string;
  kind: WoodhouseCalendarKind;
  title: string;
  start: string;
  end?: string;
  detail?: string;
}

export interface WoodhouseMetric {
  key: string;
  label: string;
  value: string | number;
  /** Highlight in Alfred when attention needed */
  alert?: boolean;
}

/** What every Tortuca / ECS app exposes at /api/woodhouse/snapshot */
export interface WoodhouseNodeSnapshot {
  protocol: typeof WOODHOUSE_NODE;
  nodeId: string;
  nodeType: string;
  displayName: string;
  generatedAt: string;
  status: WoodhouseNodeStatus;
  /** One sentence for Alfred's daily briefing */
  summary: string;
  metrics: WoodhouseMetric[];
  calendar?: WoodhouseCalendarItem[];
  priorityActions: string[];
  links?: { label: string; url: string }[];
}

export interface WoodhouseRegistryEntry {
  id: string;
  displayName: string;
  nodeType: string;
  /** App base URL (no trailing slash). Empty = use built-in provider if any. */
  baseUrl: string;
  provider?: "family-purpose-backup";
}

export interface WoodhouseNodeSyncResult {
  registryId: string;
  displayName: string;
  nodeType: string;
  baseUrl: string;
  ok: boolean;
  source: "live" | "demo" | "backup" | "builtin";
  error?: string;
  snapshot: WoodhouseNodeSnapshot | null;
}

/** Alfred's aggregated view — pull this to see everything at once */
export interface WoodhouseOrchestrationSnapshot {
  protocol: typeof WOODHOUSE_ORCHESTRATION;
  generatedAt: string;
  nodes: WoodhouseNodeSyncResult[];
  priorityActions: string[];
  calendar: WoodhouseCalendarItem[];
}

/** @deprecated v2 aggregate */
export interface WoodhouseSnapshotV2 {
  protocol: typeof WOODHOUSE_V2;
  generatedAt: string;
  store: unknown;
  familyPurpose: unknown;
  priorityActions: string[];
}

export type WoodhouseSnapshot = WoodhouseOrchestrationSnapshot | WoodhouseSnapshotV2;

export function isWoodhouseNodeSnapshot(value: unknown): value is WoodhouseNodeSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as WoodhouseNodeSnapshot;
  return v.protocol === WOODHOUSE_NODE && typeof v.displayName === "string";
}

export function isWoodhouseOrchestration(value: unknown): value is WoodhouseOrchestrationSnapshot {
  if (!value || typeof value !== "object") return false;
  return (value as WoodhouseOrchestrationSnapshot).protocol === WOODHOUSE_ORCHESTRATION;
}

export function isWoodhouseSnapshot(value: unknown): value is WoodhouseSnapshot {
  if (!value || typeof value !== "object") return false;
  const p = (value as { protocol?: string }).protocol;
  return p === WOODHOUSE_ORCHESTRATION || p === WOODHOUSE_V2 || p === WOODHOUSE_V1;
}

function legacyV2ToV3(v2: WoodhouseSnapshotV2): WoodhouseOrchestrationSnapshot {
  const nodes: WoodhouseNodeSyncResult[] = [];
  const calendar: WoodhouseCalendarItem[] = [];

  const store = v2.store as {
    storeName?: string;
    metrics?: Record<string, number>;
    priorityActions?: string[];
  } | null;
  if (store?.storeName) {
    nodes.push({
      registryId: "easy-supply-co",
      displayName: store.storeName,
      nodeType: "commerce",
      baseUrl: "",
      ok: true,
      source: "builtin",
      snapshot: {
        protocol: WOODHOUSE_NODE,
        nodeId: "easy-supply-co",
        nodeType: "commerce",
        displayName: store.storeName,
        generatedAt: v2.generatedAt,
        status: "ok",
        summary: "Store metrics synced",
        metrics: [],
        priorityActions: store.priorityActions ?? [],
      },
    });
  }

  const fp = v2.familyPurpose as {
    appName?: string;
    calendar?: WoodhouseCalendarItem[];
    priorityActions?: string[];
  } | null;
  if (fp?.appName) {
    if (fp.calendar) calendar.push(...fp.calendar);
    nodes.push({
      registryId: "family-purpose",
      displayName: fp.appName,
      nodeType: "education",
      baseUrl: "",
      ok: true,
      source: "builtin",
      snapshot: {
        protocol: WOODHOUSE_NODE,
        nodeId: "family-purpose",
        nodeType: "education",
        displayName: fp.appName,
        generatedAt: v2.generatedAt,
        status: "ok",
        summary: "Family Purpose calendar",
        metrics: [],
        calendar: fp.calendar,
        priorityActions: fp.priorityActions ?? [],
      },
    });
  }

  return {
    protocol: WOODHOUSE_ORCHESTRATION,
    generatedAt: v2.generatedAt,
    nodes,
    priorityActions: v2.priorityActions,
    calendar,
  };
}

export function upgradeWoodhouseSnapshot(raw: WoodhouseSnapshot): WoodhouseOrchestrationSnapshot {
  if (isWoodhouseOrchestration(raw)) return raw;
  return legacyV2ToV3(raw as WoodhouseSnapshotV2);
}
