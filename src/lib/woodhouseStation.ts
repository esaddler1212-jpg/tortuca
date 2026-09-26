import type { WoodhouseNodeSyncResult, WoodhouseNodeStatus } from "../types/woodhouse";

export type StationAgentActivity = "idle" | "working" | "alert" | "offline";

export interface StationAgent {
  id: string;
  name: string;
  nodeType: string;
  activity: StationAgentActivity;
  summary: string;
  deskIndex: number;
  openUrl?: string;
}

export interface StationLayout {
  agents: StationAgent[];
  commsSummary: string;
}

function nodeActivity(node: WoodhouseNodeSyncResult): StationAgentActivity {
  if (!node.ok || !node.snapshot) return "offline";
  const status: WoodhouseNodeStatus = node.snapshot.status;
  if (status === "error" || status === "offline") return "offline";
  const hasAlert = node.snapshot.metrics?.some((m) => m.alert) ?? false;
  const hasActions = (node.snapshot.priorityActions?.length ?? 0) > 0;
  if (status === "degraded" || hasAlert) return "alert";
  if (hasActions) return "working";
  return "idle";
}

function openUrl(node: WoodhouseNodeSyncResult): string | undefined {
  const link = node.snapshot?.links?.[0]?.url;
  if (link) return link;
  if (node.baseUrl) return node.baseUrl;
  return undefined;
}

/** Map live Woodhouse nodes into a fixed station roster for the pixel view. */
export function buildStationLayout(nodes: WoodhouseNodeSyncResult[]): StationLayout {
  const agents = nodes.map((node, deskIndex) => ({
    id: node.registryId,
    name: node.displayName,
    nodeType: node.nodeType,
    activity: nodeActivity(node),
    summary: node.snapshot?.summary ?? (node.ok ? "Synced" : node.error ?? "Unreachable"),
    deskIndex,
    openUrl: openUrl(node),
  }));

  const working = agents.filter((a) => a.activity === "working" || a.activity === "alert").length;
  const offline = agents.filter((a) => a.activity === "offline").length;
  let commsSummary = "All quiet on the station.";
  if (agents.length === 0) {
    commsSummary = "Recruit apps in Settings → Woodhouse.";
  } else if (working > 0) {
    commsSummary = `${working} crew member${working === 1 ? "" : "s"} on active work.`;
  } else if (offline > 0) {
    commsSummary = `${offline} node${offline === 1 ? "" : "s"} offline — check URLs.`;
  }

  return { agents, commsSummary };
}

/** Palette hints per node type (CSS hex). */
export function agentPalette(nodeType: string): { body: string; accent: string } {
  switch (nodeType) {
    case "commerce":
      return { body: "#ca8a04", accent: "#fde047" };
    case "education":
      return { body: "#2563eb", accent: "#93c5fd" };
    case "media":
      return { body: "#c026d3", accent: "#f0abfc" };
    case "ops":
      return { body: "#64748b", accent: "#cbd5e1" };
    default:
      return { body: "#16a34a", accent: "#4ade80" };
  }
}

export function activityLabel(activity: StationAgentActivity): string {
  switch (activity) {
    case "working":
      return "Working";
    case "alert":
      return "Needs attention";
    case "offline":
      return "Offline";
    default:
      return "Idle";
  }
}
