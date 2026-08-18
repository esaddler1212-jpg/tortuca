import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const BACKUP_FORMAT = "family-purpose-checkins";

interface CheckIn {
  id: string;
  createdAt: string;
}

interface GroupSession {
  id: string;
  updatedAt: string;
}

interface GroupMember {
  name: string;
  grade: string;
}

interface Backup {
  format: string;
  version: number;
  exportedAt: string;
  settings: Record<string, unknown>;
  checkIns: CheckIn[];
  groupMembers: GroupMember[];
  groupSessions: GroupSession[];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isBackup(value: unknown): value is Backup {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Backup>;
  return v.format === BACKUP_FORMAT && Array.isArray(v.checkIns);
}

function mergeBackups(base: Backup, incoming: Backup): Backup {
  const checkInMap = new Map(base.checkIns.map((c) => [c.id, c]));
  for (const c of incoming.checkIns) {
    const existing = checkInMap.get(c.id);
    if (!existing || c.createdAt > existing.createdAt) {
      checkInMap.set(c.id, c);
    }
  }

  const sessionMap = new Map(base.groupSessions.map((s) => [s.id, s]));
  for (const s of incoming.groupSessions) {
    const existing = sessionMap.get(s.id);
    if (!existing || s.updatedAt > existing.updatedAt) {
      sessionMap.set(s.id, s);
    }
  }

  const memberMap = new Map(
    base.groupMembers.map((m) => [normalizeName(m.name), m]),
  );
  for (const m of incoming.groupMembers) {
    memberMap.set(normalizeName(m.name), m);
  }

  return {
    format: BACKUP_FORMAT,
    version: base.version ?? 1,
    exportedAt: new Date().toISOString(),
    settings: base.settings,
    checkIns: [...checkInMap.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
    groupSessions: [...sessionMap.values()],
    groupMembers: [...memberMap.values()],
  };
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Backup-Key",
  };
}

function authorize(req: Request): Response | null {
  const expected = process.env.FAMILY_PURPOSE_BACKUP_KEY;
  if (!expected) {
    return new Response("Backup endpoint is not configured on the server", {
      status: 503,
      headers: corsHeaders(),
    });
  }
  const key = req.headers.get("x-backup-key");
  if (key !== expected) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
  }
  return null;
}

async function handleGet(): Promise<Response> {
  const store = getStore({
    name: "family-purpose-backups",
    consistency: "strong",
  });
  const { blobs } = await store.list();
  if (blobs.length === 0) {
    return new Response("No backups yet", {
      status: 404,
      headers: corsHeaders(),
    });
  }

  let merged: Backup | null = null;
  for (const blob of blobs) {
    const raw: unknown = await store.get(blob.key, { type: "json" });
    if (!isBackup(raw)) continue;
    merged = merged ? mergeBackups(merged, raw) : raw;
  }

  if (!merged) {
    return new Response("No valid backups found", {
      status: 404,
      headers: corsHeaders(),
    });
  }

  return Response.json(merged, { headers: corsHeaders() });
}

async function handlePost(req: Request): Promise<Response> {
  let body: {
    deviceLabel?: string;
    exportedAt?: string;
    backup?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
      headers: corsHeaders(),
    });
  }

  if (!isBackup(body.backup)) {
    return new Response("Missing backup payload", {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const device = (body.deviceLabel || "device").replace(/[^\w-]+/gi, "-");
  const stamp = body.exportedAt || new Date().toISOString();
  const id = `${device}-${stamp}`;

  const store = getStore({
    name: "family-purpose-backups",
    consistency: "strong",
  });
  await store.setJSON(id, body.backup);

  return Response.json({ ok: true, id }, { headers: corsHeaders() });
}

/**
 * Optional cloud backup for Family Purpose check-in data.
 * POST uploads a device backup; GET returns all device backups merged.
 * Set FAMILY_PURPOSE_BACKUP_KEY in Netlify env vars.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const auth = authorize(req);
  if (auth) return auth;

  if (req.method === "GET") {
    return handleGet();
  }

  if (req.method === "POST") {
    return handlePost(req);
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders(),
  });
};

export const config: Config = {
  path: "/api/family-purpose-backup",
};
