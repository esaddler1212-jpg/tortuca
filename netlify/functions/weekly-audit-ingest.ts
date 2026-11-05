import type { Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { mergeWeeklyCiResult } from "./_weeklyAuditorRun";

/** POST /api/weekly-audit-ingest — GitHub weekly workflow posts test:os result (secret required). */
export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST only" }) };
  }

  const secret = process.env.WEEKLY_AUDIT_SECRET?.trim();
  if (!secret) {
    return { statusCode: 503, body: JSON.stringify({ error: "WEEKLY_AUDIT_SECRET not configured" }) };
  }
  const auth = event.headers.authorization ?? event.headers.Authorization ?? "";
  if (auth !== `Bearer ${secret}`) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body: { passed?: boolean; note?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad JSON" }) };
  }
  if (typeof body.passed !== "boolean") {
    return { statusCode: 400, body: JSON.stringify({ error: "pass body.passed boolean" }) };
  }

  const report = await mergeWeeklyCiResult(body.passed, body.note);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, status: report.status, at: report.at }),
  };
};
