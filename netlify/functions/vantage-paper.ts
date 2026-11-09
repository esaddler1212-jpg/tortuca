import type { Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { accountKey, loadUserData, saveUserData } from "./_userData";
import { isVantagePaperEdition, type StoredVantagePaper } from "../../shared/vantagePaper";

/**
 * Receives today's Vantage Point paper — the daily newspaper a separate
 * scheduled job researches, writes and publishes to its own Claude artifact —
 * and stores it so Iris's own Vantage Point briefing can lead with the real
 * paper instead of the summary she builds herself. POST it once a day, right
 * after that job publishes. If it never arrives, or what's stored is from a
 * previous day, IRIS quietly falls back to Iris's own briefing; nothing in
 * IRIS depends on this.
 *
 * Auth is a shared secret, not a Google session: the paper is built by an
 * unattended job, not a signed-in browser. Set VANTAGE_PAPER_KEY (the secret
 * that job sends as X-Vantage-Key) and VANTAGE_ACCOUNT_EMAIL (whose IRIS
 * account to store it on) in Netlify. Neither is set in source control.
 */
const DEFAULT_URL = "https://claude.ai/artifact/Krc9x2BhnadEb3SXbH4FvR";

export const handler: Handler = async (event) => {
  initBlobs(event);
  const expectedKey = process.env.VANTAGE_PAPER_KEY;
  const email = process.env.VANTAGE_ACCOUNT_EMAIL;
  if (!expectedKey || !email) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Vantage Point delivery isn't configured (set VANTAGE_PAPER_KEY and VANTAGE_ACCOUNT_EMAIL)." }),
    };
  }
  if (event.headers["x-vantage-key"] !== expectedKey) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const key = accountKey(email);

  if (event.httpMethod === "GET") {
    const data = await loadUserData(key);
    return {
      statusCode: data?.vantagePaper ? 200 : 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data?.vantagePaper ?? { error: "No paper stored yet" }),
    };
  }

  if (event.httpMethod !== "POST") return { statusCode: 405, body: "GET or POST" };

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // Accept either the raw edition.json, or { edition, url } with an explicit link.
  const wrapped = body as { edition?: unknown; url?: unknown } | null;
  const edition = wrapped && typeof wrapped === "object" && isVantagePaperEdition(wrapped.edition) ? wrapped.edition : body;
  if (!isVantagePaperEdition(edition)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Expected today's edition.json (needs at least a 'date' field, YYYY-MM-DD)" }) };
  }
  const url = typeof wrapped?.url === "string" && wrapped.url.startsWith("https://") ? wrapped.url : DEFAULT_URL;

  const existing = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const stored: StoredVantagePaper = { edition, url, fetchedAt: new Date().toISOString() };
  await saveUserData(key, { ...existing, vantagePaper: stored, updatedAt: new Date().toISOString() });

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, date: edition.date }) };
};
