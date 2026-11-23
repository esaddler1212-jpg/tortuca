import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { mergeTierA, type WearableSnapshot } from "../../shared/tierAOps";

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

  let body: Partial<WearableSnapshot>;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }

  const snapshot: WearableSnapshot = {
    source: body.source === "oura" || body.source === "apple-health" ? body.source : "manual",
    sleepHours: typeof body.sleepHours === "number" ? Math.min(24, Math.max(0, body.sleepHours)) : undefined,
    readiness: typeof body.readiness === "number" ? Math.min(100, Math.max(0, body.readiness)) : undefined,
    steps: typeof body.steps === "number" ? Math.min(100_000, Math.max(0, Math.round(body.steps))) : undefined,
    restingHr: typeof body.restingHr === "number" ? Math.min(220, Math.max(30, Math.round(body.restingHr))) : undefined,
    updatedAt: new Date().toISOString(),
  };

  const key = await resolveDataKey(sessionId);
  const data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const tierA = mergeTierA(data.tierA, { wearable: snapshot });
  await saveUserData(key, { ...data, tierA, updatedAt: new Date().toISOString() });
  return json(200, { ok: true, wearable: snapshot });
};
