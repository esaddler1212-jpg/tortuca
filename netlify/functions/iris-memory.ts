import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";

/** GET: what Iris remembers. DELETE ?id=…: forget one. DELETE ?all=1: forget everything. */
export const handler: Handler = async (event) => {
  initBlobs(event);
  const sessionId = sessionHeader(event);
  if (!sessionId || !(await getValidSession(sessionId))) {
    return { statusCode: 401, body: JSON.stringify({ error: "Connect Google to see what Iris remembers." }) };
  }
  const key = await resolveDataKey(sessionId);
  const data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  let facts = data.irisMemory ?? [];
  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    facts = event.queryStringParameters?.all === "1" ? [] : facts.filter((m) => m.id !== id);
    await saveUserData(key, { ...data, irisMemory: facts });
  } else if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "GET or DELETE" };
  }
  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) };
};
