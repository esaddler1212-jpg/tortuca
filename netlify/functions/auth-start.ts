import type { Handler } from "@netlify/functions";
import { googleClientId, googleConfigured, SCOPES, siteUrl } from "./_shared";

export const handler: Handler = async (event) => {
  if (!googleConfigured()) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      }),
    };
  }

  const session = event.queryStringParameters?.session;
  if (!session) {
    return { statusCode: 400, body: "Missing session parameter" };
  }

  const redirectUri = `${siteUrl(event)}/api/auth-callback`;
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    // "~app" marks a sign-in started from the installed app (finishes on oauth-done.html).
    state: event.queryStringParameters?.return === "app" ? `${session}~app` : session,
  });

  return {
    statusCode: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` } as Record<string, string>,
    body: "",
  };
};
