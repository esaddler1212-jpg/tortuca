import type { Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { getStore } from "@netlify/blobs";
import {
  buildFamilyPurposeWoodhouseNode,
  demoFamilyPurposeNode,
  type FpBackup,
} from "./_family-purpose-woodhouse";

async function latestBackup(): Promise<FpBackup | null> {
  try {
    const store = getStore({ name: "family-purpose-backups", consistency: "strong" });
    const { blobs } = await store.list();
    if (!blobs.length) return null;
    const sorted = [...blobs].sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
    );
    const data = await store.get(sorted[0].key, { type: "json" });
    if (!data || typeof data !== "object") return null;
    const backup = data as FpBackup & { checkIns?: FpBackup["checkIns"] };
    if (!Array.isArray(backup.checkIns)) return null;
    return backup;
  } catch {
    return null;
  }
}

function familyNodeUrl(event: { headers: Record<string, string | undefined> }): string | null {
  const fromEnv = process.env.WOODHOUSE_FAMILY_PURPOSE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromHeader =
    event.headers["x-woodhouse-family-url"] ?? event.headers["X-Woodhouse-Family-Url"];
  if (fromHeader?.trim()) return fromHeader.trim().replace(/\/$/, "");
  return null;
}

export const handler: Handler = async (event) => {
  initBlobs(event);

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const remote = familyNodeUrl(event);
  if (remote) {
    try {
      const res = await fetch(`${remote}/api/woodhouse/snapshot`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json", "X-Woodhouse-Source": "proxy" },
          body: await res.text(),
        };
      }
    } catch {
      /* fall through */
    }
  }

  const backup = await latestBackup();
  const timeZone = process.env.WOODHOUSE_TIMEZONE?.trim() || "America/Los_Angeles";
  const node = backup
    ? buildFamilyPurposeWoodhouseNode(backup, new Date(), timeZone)
    : demoFamilyPurposeNode();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Woodhouse-Source": backup ? "backup" : "demo",
    },
    body: JSON.stringify(node),
  };
};
