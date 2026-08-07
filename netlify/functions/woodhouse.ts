import type { Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { syncRegistryEntry } from "./_woodhouse-sync";
import {
  demoRegistry,
  parseRegistryFromEnv,
  parseRegistryHeader,
  type RegistryEntry,
} from "./_woodhouse-registry";

const WOODHOUSE_ORCHESTRATION = "woodhouse/v3" as const;

function mergeRegistry(
  event: { headers: Record<string, string | undefined> },
): RegistryEntry[] {
  const fromHeader = parseRegistryHeader(
    event.headers["x-woodhouse-registry"] ?? event.headers["X-Woodhouse-Registry"],
  );
  if (fromHeader.length) return fromHeader;
  const fromEnv = parseRegistryFromEnv();
  if (fromEnv.length) return fromEnv;
  return demoRegistry();
}

export const handler: Handler = async (event) => {
  initBlobs(event);

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const registry = mergeRegistry(event);
  const useDemo =
    !parseRegistryFromEnv().length &&
    !parseRegistryHeader(
      event.headers["x-woodhouse-registry"] ?? event.headers["X-Woodhouse-Registry"],
    ).length;

  const results = await Promise.all(
    registry.map(async (entry) => {
      const sync = await syncRegistryEntry(entry, useDemo);
      return {
        registryId: entry.id,
        displayName: entry.displayName,
        nodeType: entry.nodeType,
        baseUrl: entry.baseUrl,
        ok: sync.ok,
        source: sync.source,
        error: sync.error,
        snapshot: sync.snapshot,
      };
    }),
  );

  const priorityActions = [
    ...new Set(
      results.flatMap((r) => r.snapshot?.priorityActions ?? []),
    ),
  ];

  const calendar = results.flatMap((r) => r.snapshot?.calendar ?? []);

  const anyLive = results.some((r) => r.source === "live" || r.source === "backup");
  const source = useDemo && !anyLive ? "demo" : anyLive ? "live" : "demo";

  const snapshot = {
    protocol: WOODHOUSE_ORCHESTRATION,
    generatedAt: new Date().toISOString(),
    nodes: results,
    priorityActions,
    calendar,
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
