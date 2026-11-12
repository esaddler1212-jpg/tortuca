import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import crypto from "node:crypto";
import { mergeTierA, TIER_A_LINK_CODE_TTL_MS } from "../../shared/tierAOps";

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
  const linkCode = crypto.randomBytes(8).toString("hex").toUpperCase();
  const linkCodeExpiresAt = new Date(Date.now() + TIER_A_LINK_CODE_TTL_MS).toISOString();
  tierA.sms = {
    ...tierA.sms,
    enabled: enable,
    phoneE164: phone?.startsWith("+") ? phone : phone ? `+1${phone}` : tierA.sms?.phoneE164,
    linkCode,
    linkCodeExpiresAt,
    linkedAt: tierA.sms?.linkedAt,
  };
  await saveUserData(key, { ...data, tierA, updatedAt: new Date().toISOString() });
  return json(200, {
    ok: true,
    linkCode,
    expiresAt: linkCodeExpiresAt,
    hint: `Text LINK ${linkCode} to your IRIS SMS number within one hour to finish pairing.`,
  });
};
