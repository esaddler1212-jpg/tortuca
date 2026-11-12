import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { resolveDataKey } from "./_userData";
import { queueTriageDraft } from "./_tierATriageDraft";

function json(status: number, body: unknown) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  const sessionId = sessionHeader(event);
  if (!sessionId) return json(401, { error: "Unauthorized" });
  const session = await getValidSession(sessionId);
  if (!session) return json(401, { error: "Session required" });

  let body: { triageId?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }
  const triageId = body.triageId?.trim();
  if (!triageId) return json(400, { error: "triageId required" });

  const key = await resolveDataKey(sessionId);
  const r = await queueTriageDraft(key, session.email, triageId);
  if (!r.ok) return json(400, { error: r.error ?? "Could not queue draft" });
  return json(200, { ok: true, draftId: r.draftId });
};
