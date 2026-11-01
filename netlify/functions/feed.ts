import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { fetchPublicText } from "./_fetchText";
import { parseFeed, type FeedItem } from "../../shared/hub";

/**
 * GET /api/feed?u=<url>&n=<name>&u=… → latest items per source.
 * Signed-in only, so it can't be used as an open proxy.
 */
export const handler: Handler = async (event) => {
  initBlobs(event);
  const sessionId = sessionHeader(event);
  if (!sessionId || !(await getValidSession(sessionId))) {
    return { statusCode: 401, body: JSON.stringify({ error: "Connect Google to load your feed." }) };
  }
  const urls = (event.multiValueQueryStringParameters?.u ?? []).slice(0, 15);
  const names = event.multiValueQueryStringParameters?.n ?? [];
  const results = await Promise.all(
    urls.map(async (url, i) => {
      const name = names[i] ?? url;
      try {
        const xml = await fetchPublicText(url, 7000);
        return { url, items: parseFeed(xml, name, 6) as FeedItem[] };
      } catch (e) {
        return { url, items: [] as FeedItem[], error: e instanceof Error ? e.message : "failed" };
      }
    }),
  );
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=600" },
    body: JSON.stringify({ fetchedAt: new Date().toISOString(), sources: results }),
  };
};
