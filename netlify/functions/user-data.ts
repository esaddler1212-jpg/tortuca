import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, mergeSubs, pushTargets, resolveDataKey, saveUserData } from "./_userData";
import type { AlfredUserData } from "../../shared/userDataTypes";
import { mergeDelegateHistories } from "../../shared/irisTeamActivity";
import { mergeTierA } from "../../shared/tierAOps";

export const handler: Handler = async (event) => {
  initBlobs(event);

  const sessionId = sessionHeader(event);
  if (!sessionId) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // Shared across devices once Google is connected.
  const key = await resolveDataKey(sessionId);

  if (event.httpMethod === "GET") {
    const session = await getValidSession(sessionId);
    if (!session) {
      return { statusCode: 401, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Session required" }) };
    }
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

    let incoming: Partial<AlfredUserData>;
    try {
      incoming = JSON.parse(event.body ?? "{}") as Partial<AlfredUserData>;
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) };
    }
    const existing = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
    const merged: AlfredUserData = {
      ...existing,
      ...incoming,
      settings: incoming.settings ? { ...existing.settings, ...incoming.settings } : existing.settings,
      todos: incoming.todos ?? existing.todos,
      irisDelegateHistory: incoming.irisDelegateHistory
        ? mergeDelegateHistories(existing.irisDelegateHistory, incoming.irisDelegateHistory)
        : existing.irisDelegateHistory,
      pushSubscription:
        incoming.pushSubscription !== undefined ? incoming.pushSubscription : existing.pushSubscription,
      // Add this device to the list instead of replacing the other devices.
      pushSubscriptions: incoming.pushSubscription
        ? mergeSubs(pushTargets(existing), [incoming.pushSubscription])
        : pushTargets(existing),
      tierA: incoming.tierA ? mergeTierA(existing.tierA, incoming.tierA) : existing.tierA,
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
