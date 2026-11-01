import type { Handler } from "@netlify/functions";
import {
  envNeedsCleaning,
  googleClientId,
  googleClientSecret,
  googleConfigured,
  initBlobs,
  siteUrl,
} from "./_shared";

export const handler: Handler = async (event) => {
  initBlobs(event);

  const clientId = googleClientId();
  const secret = googleClientSecret();
  const hasClientId = Boolean(clientId);
  const hasClientSecret = Boolean(secret);
  const configured = googleConfigured();
  const redirectUri = `${siteUrl(event)}/api/auth-callback`;

  let hint: string;
  if (configured) {
    hint = `OAuth keys are set. Add this exact redirect URI in Google Cloud → Credentials → your Web client: ${redirectUri}`;
  } else if (!hasClientId && !hasClientSecret) {
    hint =
      "Neither GOOGLE_CLIENT_ID nor GOOGLE_CLIENT_SECRET is visible to Functions. Add both in Netlify → Site configuration → Environment variables. Scope must include Functions (or All). Then Trigger deploy.";
  } else if (!hasClientId) {
    hint =
      "GOOGLE_CLIENT_ID is missing from the Functions runtime. Check the variable name (exact spelling) and scope includes Functions.";
  } else {
    hint =
      "GOOGLE_CLIENT_SECRET is missing from the Functions runtime. Check the variable name (exact spelling) and scope includes Functions.";
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      configured,
      hasClientId,
      hasClientSecret,
      redirectUri,
      hint,
      // Safe diagnostics: the client ID is public; the secret is described, never shown.
      clientId,
      clientIdLooksValid: /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(clientId),
      secretLength: secret.length,
      secretLooksValid: /^GOCSPX-[A-Za-z0-9_-]{20,}$/.test(secret),
      cleanedWhitespaceOrQuotes: {
        GOOGLE_CLIENT_ID: envNeedsCleaning("GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET: envNeedsCleaning("GOOGLE_CLIENT_SECRET"),
      },
    }),
  };
};
