import type { Handler } from "@netlify/functions";
import { getValidSession, sessionHeader } from "./_shared";
import { loadUserData, saveUserData } from "./_userData";
import type { AlfredUserData } from "../../shared/userDataTypes";

export const handler: Handler = async (event) => {
  const sessionId = sessionHeader(event);
  if (!sessionId) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod === "GET") {
    const data = await loadUserData(sessionId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? { updatedAt: new Date().toISOString() }),
    };
  }

  if (event.httpMethod === "PUT") {
    const session = await getValidSession(sessionId);
    if (!session) {
      return { statusCode: 401, body: JSON.stringify({ error: "Session required" }) };
    }

    const incoming = JSON.parse(event.body ?? "{}") as Partial<AlfredUserData>;
    const existing = (await loadUserData(sessionId)) ?? { updatedAt: new Date().toISOString() };
    const merged: AlfredUserData = {
      ...existing,
      ...incoming,
      settings: incoming.settings ? { ...existing.settings, ...incoming.settings } : existing.settings,
      todos: incoming.todos ?? existing.todos,
      pushSubscription:
        incoming.pushSubscription !== undefined ? incoming.pushSubscription : existing.pushSubscription,
      updatedAt: new Date().toISOString(),
    };
    await saveUserData(sessionId, merged);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
