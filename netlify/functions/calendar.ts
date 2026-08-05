import type { Handler } from "@netlify/functions";
import { getValidSession, sessionHeader } from "./_shared";

export const handler: Handler = async (event) => {
  const sessionId = sessionHeader(event);
  if (!sessionId) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const session = await getValidSession(sessionId);
  if (!session?.refreshToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Not connected" }) };
  }

  const now = new Date();
  const timeMin = now.toISOString();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax: weekLater,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );

  if (!calRes.ok) {
    return {
      statusCode: calRes.status,
      body: JSON.stringify({ error: "Calendar API error" }),
    };
  }

  const data = (await calRes.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      location?: string;
    }>;
  };

  const events = (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.summary ?? "(No title)",
    start: item.start?.dateTime ?? `${item.start?.date}T00:00:00`,
    end: item.end?.dateTime ?? item.end?.date,
    location: item.location,
    source: "google" as const,
  }));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  };
};
