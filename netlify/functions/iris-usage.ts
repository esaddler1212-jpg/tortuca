import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUsage } from "./_irisUsage";
import { summarize } from "../../shared/irisUsage";
import { dayKey } from "../../shared/timezone";

/** GET /api/iris-usage?tz=…: this month's Iris calls, speed and estimated cost (numbers only). */
export const handler: Handler = async (event) => {
  initBlobs(event);
  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) return { statusCode: 401, body: JSON.stringify({ error: "Connect Google to see Iris's usage." }) };
  let tz = "America/Los_Angeles";
  try {
    const asked = event.queryStringParameters?.tz;
    if (asked) {
      new Intl.DateTimeFormat("en-US", { timeZone: asked });
      tz = asked;
    }
  } catch {
    /* keep default */
  }
  const today = dayKey(tz);
  const who = (session.email ?? sessionId).toLowerCase();
  const summary = summarize(await loadUsage(who, today.slice(0, 7)), today);
  return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(summary) };
};
