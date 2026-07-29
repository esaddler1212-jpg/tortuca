import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Optional cloud backup for Family Purpose check-in data.
 * Set FAMILY_PURPOSE_BACKUP_KEY in Netlify env vars; users paste the same value
 * in Settings as their backup upload key.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const expected = process.env.FAMILY_PURPOSE_BACKUP_KEY;
  if (!expected) {
    return new Response("Backup endpoint is not configured on the server", {
      status: 503,
    });
  }
  const key = req.headers.get("x-backup-key");
  if (key !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    deviceLabel?: string;
    exportedAt?: string;
    backup?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body.backup) {
    return new Response("Missing backup payload", { status: 400 });
  }

  const device = (body.deviceLabel || "device").replace(/[^\w-]+/gi, "-");
  const stamp = body.exportedAt || new Date().toISOString();
  const id = `${device}-${stamp}`;

  const store = getStore({
    name: "family-purpose-backups",
    consistency: "strong",
  });
  await store.setJSON(id, body.backup);

  return Response.json({ ok: true, id });
};

export const config: Config = {
  path: "/api/family-purpose-backup",
};
