import type { Handler } from "@netlify/functions";
import { googleConfigured, siteUrl } from "./_shared";

export const handler: Handler = async (event) => {
  const configured = googleConfigured();
  const redirectUri = `${siteUrl(event)}/api/auth-callback`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      configured,
      redirectUri,
      hint: configured
        ? `OAuth keys are set. Add this exact redirect URI in Google Cloud → Credentials → your Web client: ${redirectUri}`
        : "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Netlify → Site configuration → Environment variables, then redeploy.",
    }),
  };
};
