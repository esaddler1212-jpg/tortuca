/**
 * /api/cos — the ECS Chief of Staff agent's door into Alfred.
 *
 *   GET  /api/cos[?format=json]   ECS snapshot (markdown by default)
 *   POST /api/cos                 { items: [{ kind, title, body, division?, commitment? }] }
 *                                 adds memos / suggested commitments to the app's CoS inbox
 *
 * Auth: `Authorization: Bearer $COS_AGENT_TOKEN`. Reads and writes the data of
 * the Google account in COS_OWNER_EMAIL (the account Alfred is signed in with).
 * Both env vars must be set on Netlify; without them the endpoint is off.
 */
import type { Handler } from "@netlify/functions";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { initBlobs } from "./_shared";
import { accountKey, loadUserData, pushAll, saveUserData } from "./_userData";
import { EMPTY_PLAN, type PlanState } from "../../shared/plan";
import { EMPTY_HUB, type HubState } from "../../shared/hub";
import {
  isDivision,
  normalizeCos,
  renderCosMarkdown,
  scorecard,
  bucketCommitments,
  weekOf,
  type CosInboxItem,
} from "../../shared/chiefOfStaff";
import { dayKey } from "../../shared/timezone";

const INBOX_MAX = 40;
const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

function env(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

/** Constant-time token check (hash both so lengths match). */
function authorized(header: string | undefined): boolean {
  const want = env("COS_AGENT_TOKEN");
  if (want.length < 24) return false;
  const got = (header ?? "").replace(/^Bearer\s+/i, "").trim();
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(got), h(want));
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const ymd = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

function parseItem(raw: unknown, now: string): CosInboxItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = clip(r.title, 140);
  const body = clip(r.body, 12_000);
  if (!title || (!body && !r.commitment)) return null;
  const item: CosInboxItem = {
    id: `cos-${Date.now().toString(36)}${randomBytes(3).toString("hex")}`,
    at: now,
    kind: r.kind === "suggestion" ? "suggestion" : "memo",
    title,
    body,
    division: isDivision(r.division) ? r.division : undefined,
  };
  const c = r.commitment as Record<string, unknown> | undefined;
  if (c && typeof c === "object" && clip(c.text, 300)) {
    item.kind = "suggestion";
    item.commitment = {
      text: clip(c.text, 300),
      direction: c.direction === "theirs" ? "theirs" : "mine",
      who: clip(c.who, 80) || undefined,
      due: ymd(c.due),
    };
  }
  return item;
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  const owner = env("COS_OWNER_EMAIL");
  if (!owner || env("COS_AGENT_TOKEN").length < 24) {
    return json(503, { error: "Chief of Staff agent access is off. Set COS_AGENT_TOKEN (24+ chars) and COS_OWNER_EMAIL on Netlify." });
  }
  if (!authorized(event.headers.authorization ?? event.headers.Authorization)) {
    return json(401, { error: "Unauthorized" });
  }

  const key = accountKey(owner);
  const data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const tz = env("WOODHOUSE_TIMEZONE") || "America/Los_Angeles";
  const today = dayKey(tz, new Date());

  if (event.httpMethod === "GET") {
    const cos = normalizeCos(data.cos as never);
    const plan = { ...EMPTY_PLAN, ...((data.plan as PlanState | undefined) ?? {}) } as PlanState;
    const hub = { ...EMPTY_HUB, ...((data.hub as HubState | undefined) ?? {}) } as HubState;
    if (event.queryStringParameters?.format === "json") {
      return json(200, {
        today,
        week: weekOf(cos, today),
        scorecard: scorecard(cos, plan, hub, today),
        commitments: bucketCommitments(cos.commitments, today),
        decisions: cos.decisions.slice(-20),
        inbox: ((data.cosInbox ?? []) as CosInboxItem[]).filter((i) => !cos.inboxHandled.includes(i.id)),
      });
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" },
      body: renderCosMarkdown(cos, plan, hub, today),
    };
  }

  if (event.httpMethod === "POST") {
    let payload: { items?: unknown[]; notify?: boolean };
    try {
      payload = JSON.parse(event.body ?? "{}");
    } catch {
      return json(400, { error: "Body must be JSON" });
    }
    const now = new Date().toISOString();
    const items = (Array.isArray(payload.items) ? payload.items : [])
      .slice(0, 10)
      .map((r) => parseItem(r, now))
      .filter((i): i is CosInboxItem => i !== null);
    if (!items.length) return json(400, { error: "No valid items (each needs a title and a body or commitment)" });

    // Re-read right before writing to keep the window for lost updates small.
    const latest = (await loadUserData(key)) ?? data;
    const inbox = [...items, ...((latest.cosInbox ?? []) as CosInboxItem[])].slice(0, INBOX_MAX);
    await saveUserData(key, { ...latest, cosInbox: inbox });

    if (payload.notify !== false) {
      const memo = items.find((i) => i.kind === "memo") ?? items[0];
      await pushAll(latest, {
        title: "Chief of Staff",
        body: items.length > 1 ? `${memo.title} (+${items.length - 1} more)` : memo.title,
        url: "/#chief-of-staff",
      }).catch(() => false);
    }
    return json(200, { added: items.map((i) => ({ id: i.id, kind: i.kind, title: i.title })) });
  }

  return json(405, { error: "Method not allowed" });
};
