import type { Handler } from "@netlify/functions";
import { deleteSession, loadSession, saveSession, sessionHeader } from "./_shared";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "POST") {
    const sessionId = crypto.randomUUID();
    await saveSession(sessionId, {
      refreshToken: "",
      accessToken: "",
      expiresAt: 0,
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    };
  }

  const sessionId = sessionHeader(event);
  if (!sessionId) {
    return { statusCode: 400, body: "Missing session" };
  }

  if (event.httpMethod === "GET") {
    const session = await loadSession(sessionId);
    const connected = Boolean(session?.refreshToken);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connected, email: session?.email }),
    };
  }

  if (event.httpMethod === "DELETE") {
    await deleteSession(sessionId);
    return { statusCode: 204, body: "" };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
