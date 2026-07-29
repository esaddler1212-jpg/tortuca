import type {
  WoodhouseNodeSyncResult,
  WoodhouseOrchestrationSnapshot,
} from "../types/woodhouse";
import {
  isWoodhouseSnapshot,
  upgradeWoodhouseSnapshot,
  WOODHOUSE_NODE,
  WOODHOUSE_ORCHESTRATION,
} from "../types/woodhouse";
import { loadSettings } from "./storage";

function apiBase(): string {
  return "/api";
}

function demoOrchestration(): WoodhouseOrchestrationSnapshot {
  const generatedAt = new Date().toISOString();
  const commerce: WoodhouseNodeSyncResult = {
    registryId: "easy-supply-co",
    displayName: "Easy Supply Co. (demo)",
    nodeType: "commerce",
    baseUrl: "",
    ok: true,
    source: "demo",
    snapshot: {
      protocol: WOODHOUSE_NODE,
      nodeId: "easy-supply-co",
      nodeType: "commerce",
      displayName: "Easy Supply Co. (demo)",
      generatedAt,
      status: "ok",
      summary: "2 orders need approval",
      metrics: [
        { key: "revenue", label: "MTD revenue", value: 2840 },
        { key: "pending", label: "Pending approvals", value: 2, alert: true },
      ],
      priorityActions: ["Approve 2 pending Shopify orders"],
    },
  };
  const education: WoodhouseNodeSyncResult = {
    registryId: "family-purpose",
    displayName: "Family Purpose (demo)",
    nodeType: "education",
    baseUrl: "",
    ok: true,
    source: "demo",
    snapshot: {
      protocol: WOODHOUSE_NODE,
      nodeId: "family-purpose",
      nodeType: "education",
      displayName: "Family Purpose",
      generatedAt,
      status: "ok",
      summary: "1 follow-up due today · BOYS Group meeting",
      metrics: [
        { key: "checkins", label: "Check-ins today", value: 3 },
        { key: "due", label: "Follow-ups due", value: 1, alert: true },
      ],
      calendar: [
        {
          id: "g1",
          kind: "group_meeting",
          title: "BOYS Group meeting",
          start: generatedAt,
          detail: "Weekly sign-in",
        },
      ],
      priorityActions: ["1 follow-up due today"],
    },
  };
  return {
    protocol: WOODHOUSE_ORCHESTRATION,
    generatedAt,
    nodes: [commerce, education],
    priorityActions: [
      "Approve 2 pending Shopify orders",
      "1 follow-up due today",
    ],
    calendar: education.snapshot?.calendar ?? [],
  };
}

export async function fetchWoodhouseSnapshot(): Promise<{
  snapshot: WoodhouseOrchestrationSnapshot;
  source: "live" | "demo" | "proxy" | "backup";
}> {
  const settings = loadSettings();
  const headers: HeadersInit = { Accept: "application/json" };
  if (settings.woodhouseNodes.length > 0) {
    headers["X-Woodhouse-Registry"] = JSON.stringify(settings.woodhouseNodes);
  }

  try {
    const res = await fetch(`${apiBase()}/woodhouse`, { headers });
    if (res.ok) {
      const body: unknown = await res.json();
      if (isWoodhouseSnapshot(body)) {
        const snapshot = upgradeWoodhouseSnapshot(body);
        const headerSource = res.headers.get("X-Woodhouse-Source");
        const source =
          headerSource === "demo"
            ? "demo"
            : headerSource === "backup"
              ? "backup"
              : "live";
        return { snapshot, source };
      }
    }
  } catch {
    /* Netlify Functions unavailable in plain Vite dev */
  }

  return { snapshot: demoOrchestration(), source: "demo" };
}

export { WOODHOUSE_ORCHESTRATION };
