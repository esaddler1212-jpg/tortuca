import {
  buildFamilyPurposeWoodhouseNode,
  demoFamilyPurposeNode,
  type FpBackup,
} from "./_family-purpose-woodhouse";
import type { NodeSnapshot, RegistryEntry } from "./_woodhouse-registry";
import { normalizeRemoteSnapshot } from "./_woodhouse-registry";
import { getStore } from "@netlify/blobs";

export function demoCommerceSnapshot(): NodeSnapshot {
  return {
    protocol: "woodhouse/node/v1",
    nodeId: "easy-supply-co",
    nodeType: "commerce",
    displayName: "Easy Supply Co. (demo)",
    generatedAt: new Date().toISOString(),
    status: "ok",
    summary: "2 orders need approval",
    metrics: [
      { key: "revenue", label: "MTD revenue", value: 2840 },
      { key: "orders", label: "Orders", value: 18 },
      { key: "goal", label: "Goal", value: "57%" },
      { key: "pending", label: "Pending approvals", value: 2, alert: true },
    ],
    priorityActions: [
      "Approve 2 pending Shopify orders",
      "Close $2160 gap to $5000/mo goal",
    ],
    links: [{ label: "Open command center", url: "https://example.com" }],
  };
}

export function demoEducationSnapshot(): NodeSnapshot {
  const fp = demoFamilyPurposeNode();
  return normalizeRemoteSnapshot(
    { id: "family-purpose", displayName: "Family Purpose", nodeType: "education", baseUrl: "" },
    fp,
  )!;
}

async function familyFromBackup(): Promise<NodeSnapshot | null> {
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
    const tz = process.env.WOODHOUSE_TIMEZONE?.trim() || "America/Los_Angeles";
    const fp = buildFamilyPurposeWoodhouseNode(backup, new Date(), tz);
    return normalizeRemoteSnapshot(
      { id: "family-purpose", displayName: "Family Purpose", nodeType: "education", baseUrl: "" },
      fp,
    );
  } catch {
    return null;
  }
}

export async function syncRegistryEntry(
  entry: RegistryEntry,
  useDemo: boolean,
): Promise<{
  ok: boolean;
  source: "live" | "demo" | "backup" | "builtin";
  error?: string;
  snapshot: NodeSnapshot | null;
}> {
  if (entry.provider === "family-purpose-backup") {
    const snap = await familyFromBackup();
    if (snap) return { ok: true, source: "backup", snapshot: snap };
    if (useDemo) return { ok: true, source: "demo", snapshot: demoEducationSnapshot() };
    return { ok: false, source: "backup", error: "No Family Purpose backup found", snapshot: null };
  }

  if (!entry.baseUrl) {
    if (useDemo) {
      if (entry.nodeType === "commerce") {
        return { ok: true, source: "demo", snapshot: demoCommerceSnapshot() };
      }
      if (entry.nodeType === "education") {
        return { ok: true, source: "demo", snapshot: demoEducationSnapshot() };
      }
    }
    return { ok: false, source: "builtin", error: "No URL configured", snapshot: null };
  }

  try {
    const res = await fetch(`${entry.baseUrl}/api/woodhouse/snapshot`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        ok: false,
        source: "live",
        error: `HTTP ${res.status}`,
        snapshot: null,
      };
    }
    const body: unknown = await res.json();
    const snapshot = normalizeRemoteSnapshot(entry, body);
    if (!snapshot) {
      return { ok: false, source: "live", error: "Unrecognized snapshot shape", snapshot: null };
    }
    return { ok: true, source: "live", snapshot };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return { ok: false, source: "live", error: message, snapshot: null };
  }
}
