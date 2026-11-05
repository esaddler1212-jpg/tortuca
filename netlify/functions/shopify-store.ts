import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { fetchShopifyStore } from "./_shopify";

/** GET /api/shopify-store — read-only Easy Supply / Shopify snapshot (signed-in). */
export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "GET only" }) };
  }
  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) {
    return { statusCode: 401, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Connect Google first." }) };
  }
  const snapshot = await fetchShopifyStore();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  };
};
