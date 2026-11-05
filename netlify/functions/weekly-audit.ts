import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadLatestWeeklyAudit } from "./_weeklyAuditorRun";

/** GET /api/weekly-audit — latest weekly auditor report (signed-in). */
export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "GET only" }) };
  }
  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) {
    return { statusCode: 401, body: JSON.stringify({ error: "Connect Google first." }) };
  }

  const report = await loadLatestWeeklyAudit();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=300" },
    body: JSON.stringify(report ?? { at: null, status: "unknown", summary: "No weekly run yet.", checks: [], suggestions: [] }),
  };
};
