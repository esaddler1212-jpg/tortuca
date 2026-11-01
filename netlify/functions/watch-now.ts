import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey } from "./_userData";
import { runWatchers, stripText } from "./_watchers";
import type { WatchResult } from "../../shared/hub";

/** GET: last results. POST: check this user's watchers now (no push). */
export const handler: Handler = async (event) => {
  initBlobs(event);
  const sessionId = sessionHeader(event);
  if (!sessionId || !(await getValidSession(sessionId))) {
    return { statusCode: 401, body: JSON.stringify({ error: "Connect Google to use watchers." }) };
  }
  const key = await resolveDataKey(sessionId);
  const data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  if (event.httpMethod === "POST") {
    const { state, alerts } = await runWatchers(key, data, { notify: false });
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, alerts }) };
  }
  const state = stripText((data.watchState ?? {}) as Record<string, WatchResult & { text?: string }>);
  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, alerts: [] }) };
};
