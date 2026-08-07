import type { Handler } from "@netlify/functions";
import { initBlobs, saveSession, siteUrl } from "./_shared";

export const handler: Handler = async (event) => {
  initBlobs(event);

  const code = event.queryStringParameters?.code;
  const sessionId = event.queryStringParameters?.state;
  const error = event.queryStringParameters?.error;

  if (error || !code || !sessionId) {
    const reason = error === "access_denied" ? "denied" : !code ? "missing" : "state";
    return {
      statusCode: 302,
      headers: { Location: `${siteUrl(event)}/?connected=0&oauth_error=${reason}` },
      body: "",
    };
  }

  const redirectUri = `${siteUrl(event)}/api/auth-callback`;
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    let reason = "token";
    try {
      const err = (await tokenRes.json()) as { error?: string };
      if (err.error === "redirect_uri_mismatch") reason = "redirect";
      else if (err.error === "invalid_client") reason = "client";
    } catch {
      /* ignore parse errors */
    }
    return {
      statusCode: 302,
      headers: { Location: `${siteUrl(event)}/?connected=0&oauth_error=${reason}` },
      body: "",
    };
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  let email: string | undefined;
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (profileRes.ok) {
    const profile = (await profileRes.json()) as { email?: string };
    email = profile.email;
  }

  const existing = await import("./_shared").then((m) => m.loadSession(sessionId));
  const refreshToken = tokens.refresh_token ?? existing?.refreshToken ?? "";

  await saveSession(sessionId, {
    refreshToken,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    email,
  });

  return {
    statusCode: 302,
    headers: { Location: `${siteUrl(event)}/?connected=1` },
    body: "",
  };
};
