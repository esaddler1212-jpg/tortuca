import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { mergeTierA, newId } from "../../shared/tierAOps";

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

  let body: { enable?: boolean; phone?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }

  const key = await resolveDataKey(sessionId);
  const data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const tierA = mergeTierA(data.tierA, {});
  const enable = body.enable !== false;
  const phone = body.phone?.replace(/[\s()-]/g, "").trim();
  const linkCode = tierA.sms?.linkCode ?? Math.random().toString(36).slice(2, 8).toUpperCase();
  tierA.sms = {
    ...tierA.sms,
    enabled: enable,
    phoneE164: phone?.startsWith("+") ? phone : phone ? `+1${phone}` : tierA.sms?.phoneE164,
    linkCode,
    linkedAt: tierA.sms?.linkedAt,
  };
  await saveUserData(key, { ...data, tierA, updatedAt: new Date().toISOString() });
  return json(200, {
    ok: true,
    linkCode,
    hint: `Text LINK ${linkCode} to your IRIS SMS number to finish pairing.`,
  });
};
