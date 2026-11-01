import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, mergeSubs, pushTargets, resolveDataKey, saveUserData } from "./_userData";
import type { AlfredUserData } from "../../shared/userDataTypes";

export const handler: Handler = async (event) => {
  initBlobs(event);

  const sessionId = sessionHeader(event);
  if (!sessionId) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // Shared across devices once Google is connected.
  const key = await resolveDataKey(sessionId);

  if (event.httpMethod === "GET") {
    const data = await loadUserData(key);
    // Watcher page copies are large and server-only; results come from /api/watch-now.
    if (data) delete data.watchState;
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
    const existing = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
    const merged: AlfredUserData = {
      ...existing,
      ...incoming,
      settings: incoming.settings ? { ...existing.settings, ...incoming.settings } : existing.settings,
      todos: incoming.todos ?? existing.todos,
      pushSubscription:
        incoming.pushSubscription !== undefined ? incoming.pushSubscription : existing.pushSubscription,
      // Add this device to the list instead of replacing the other devices.
      pushSubscriptions: incoming.pushSubscription
        ? mergeSubs(pushTargets(existing), [incoming.pushSubscription])
        : pushTargets(existing),
      updatedAt: new Date().toISOString(),
    };
    await saveUserData(key, merged);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
