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

  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=12&labelIds=INBOX",
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );

  if (!listRes.ok) {
    return {
      statusCode: listRes.status,
      body: JSON.stringify({ error: "Gmail API error" }),
    };
  }

  const list = (await listRes.json()) as {
    messages?: Array<{ id: string }>;
  };

  const ids = list.messages ?? [];
  const messages = await Promise.all(
    ids.map(async ({ id }) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      if (!msgRes.ok) return null;
      const msg = (await msgRes.json()) as {
        id: string;
        snippet: string;
        labelIds?: string[];
        internalDate?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      };
      const headers = msg.payload?.headers ?? [];
      const get = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
      const dateRaw = get("Date");
      const date = dateRaw
        ? new Date(dateRaw).toISOString()
        : msg.internalDate
          ? new Date(Number(msg.internalDate)).toISOString()
          : new Date().toISOString();
      return {
        id: msg.id,
        subject: get("Subject") || "(No subject)",
        from: get("From") || "Unknown",
        snippet: msg.snippet,
        date,
        unread: (msg.labelIds ?? []).includes("UNREAD"),
      };
    }),
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.filter(Boolean) }),
  };
};
