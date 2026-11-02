import type {
  WoodhouseOrchestrationSnapshot,
} from "../types/woodhouse";
import {
  isWoodhouseSnapshot,
  upgradeWoodhouseSnapshot,
  WOODHOUSE_ORCHESTRATION,
} from "../types/woodhouse";
import { loadSettings } from "./storage";

function apiBase(): string {
  return "/api";
}

/**
 * When the server can't be reached: an empty snapshot. (This used to be sample
 * data with a fake student and fake orders, which showed up as real tasks.)
 */
function emptyOrchestration(): WoodhouseOrchestrationSnapshot {
  return { protocol: WOODHOUSE_ORCHESTRATION, generatedAt: new Date().toISOString(), nodes: [], priorityActions: [], calendar: [] };
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

  return { snapshot: emptyOrchestration(), source: "demo" };
}

export { WOODHOUSE_ORCHESTRATION };
