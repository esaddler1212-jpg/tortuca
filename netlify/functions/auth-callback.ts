import type { Handler } from "@netlify/functions";
import { googleClientId, googleClientSecret, initBlobs, saveSession, siteUrl } from "./_shared";

export const handler: Handler = async (event) => {
  initBlobs(event);

  const code = event.queryStringParameters?.code;
  const rawState = event.queryStringParameters?.state ?? "";
  const fromApp = rawState.endsWith("~app");
  const sessionId = fromApp ? rawState.slice(0, -"~app".length) : rawState;
  const error = event.queryStringParameters?.error;

  // Sign-ins started from the installed app finish on a "go back to Alfred" page.
  const doneUrl = (ok: boolean, reason?: string) =>
    fromApp
      ? `${siteUrl(event)}/oauth-done.html?ok=${ok ? 1 : 0}${reason ? `&oauth_error=${reason}` : ""}`
      : `${siteUrl(event)}/?connected=${ok ? 1 : 0}${reason ? `&oauth_error=${reason}` : ""}`;

  if (error || !code || !sessionId) {
    const reason = error === "access_denied" ? "denied" : !code ? "missing" : "state";
    return { statusCode: 302, headers: { Location: doneUrl(false, reason) }, body: "" };
  }

  const redirectUri = `${siteUrl(event)}/api/auth-callback`;
  const body = new URLSearchParams({
    code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
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
    return { statusCode: 302, headers: { Location: doneUrl(false, reason) }, body: "" };
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

  // Move this device's saved data onto the Google account (shared by all devices).
  try {
    const { resolveDataKey } = await import("./_userData");
    await resolveDataKey(sessionId);
  } catch {
    /* data moves on the next sync instead */
  }

  return {
    statusCode: 302,
    headers: { Location: doneUrl(true) },
    body: "",
  };
};
