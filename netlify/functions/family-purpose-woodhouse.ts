import type { Handler } from "@netlify/functions";
import { loadMergedBackup } from "./_fp-backup";
import { initBlobs } from "./_shared";
import {
  buildFamilyPurposeWoodhouseNode,
  demoFamilyPurposeNode,
  emptyFamilyPurposeNode,
  type FpBackup,
} from "./_family-purpose-woodhouse";

/** Every device's latest Family Purpose backup, merged (see _fp-backup.ts). */
async function latestBackup(): Promise<FpBackup | null> {
  try {
    return ((await loadMergedBackup()) as unknown as FpBackup) ?? null;
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
    : process.env.WOODHOUSE_DEMO === "1"
      ? demoFamilyPurposeNode()
      : emptyFamilyPurposeNode(new Date(), timeZone);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Woodhouse-Source": backup ? "backup" : process.env.WOODHOUSE_DEMO === "1" ? "demo" : "empty",
    },
    body: JSON.stringify(node),
  };
};
