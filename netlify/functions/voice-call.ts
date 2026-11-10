import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader, siteUrl } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { placeTwilioCall, twilioConfigured } from "./_twilio";

function json(status: number, body: unknown) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  if (!twilioConfigured()) return json(503, { error: "Twilio not configured" });
  const sessionId = sessionHeader(event);
  if (!sessionId) return json(401, { error: "Unauthorized" });
  const session = await getValidSession(sessionId);
  if (!session) return json(401, { error: "Session required" });

  let body: { callId?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }
  const callId = body.callId?.trim();
  if (!callId) return json(400, { error: "callId required" });

  const key = await resolveDataKey(sessionId);
  const data = await loadUserData(key);
  const call = data?.tierA?.voiceCalls?.find((c) => c.id === callId && c.status === "pending");
  if (!call) return json(404, { error: "Call not found" });

  const twimlUrl = `${siteUrl(event)}/api/twilio-voice-twiml?callId=${encodeURIComponent(callId)}&key=${encodeURIComponent(key)}`;
  const ok = await placeTwilioCall(call.toNumber, twimlUrl);
  if (!ok) return json(502, { error: "Twilio call failed" });

  const now = new Date().toISOString();
  const voiceCalls = (data!.tierA!.voiceCalls ?? []).map((c) =>
    c.id === callId ? { ...c, status: "placed" as const, placedAt: now } : c,
  );
  await saveUserData(key, { ...data!, tierA: { ...data!.tierA!, voiceCalls }, updatedAt: now });
  return json(200, { ok: true });
};
