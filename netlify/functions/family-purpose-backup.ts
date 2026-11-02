import type { Config } from "@netlify/functions";
import { backupStore, isBackup, loadMergedBackup } from "./_fp-backup";

/**
 * Family Purpose app ↔ IRIS sync. Point the Family Purpose app's backup URL at
 * https://<iris-site>/api/family-purpose-backup with the same key as
 * FAMILY_PURPOSE_BACKUP_KEY here. POST uploads a device's backup; GET returns
 * every device's backup merged (phone ↔ computer sync). IRIS itself only ever
 * shows counts and times from it (see _family-purpose-woodhouse.ts).
 */
function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Backup-Key",
  };
}

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  const expected = process.env.FAMILY_PURPOSE_BACKUP_KEY;
  if (!expected) return new Response("Backup endpoint is not configured on the server", { status: 503, headers: cors() });
  if (req.headers.get("x-backup-key") !== expected) return new Response("Unauthorized", { status: 401, headers: cors() });

  if (req.method === "GET") {
    const merged = await loadMergedBackup();
    return merged ? Response.json(merged, { headers: cors() }) : new Response("No backups yet", { status: 404, headers: cors() });
  }
  if (req.method === "POST") {
    let body: { deviceLabel?: string; backup?: unknown };
    try {
      body = (await req.json()) as { deviceLabel?: string; backup?: unknown };
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: cors() });
    }
    if (!isBackup(body.backup)) return new Response("Missing backup payload", { status: 400, headers: cors() });
    const device = (body.deviceLabel || "device").replace(/[^\w-]+/gi, "-").slice(0, 60);
    // One copy per device (the latest), so storage doesn't grow with every sync.
    await backupStore().setJSON(`latest/${device}`, body.backup);
    return Response.json({ ok: true, id: `latest/${device}` }, { headers: cors() });
  }
  return new Response("Method not allowed", { status: 405, headers: cors() });
};

export const config: Config = { path: "/api/family-purpose-backup" };
