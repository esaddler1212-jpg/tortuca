import type { Handler } from "@netlify/functions";
import { initBlobs, siteUrl } from "./_shared";
import { loadUserData } from "./_userData";
import { consumeVoiceTwimlNonce } from "./_tierAVoiceTwiml";
import { validateTwilioSignature, twilioConfigured } from "./_twilio";

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formBody(event: { body?: string | null; headers: Record<string, string | undefined> }): Record<string, string> {
  const raw = event.body ?? "";
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  const token = event.queryStringParameters?.token ?? "";
  if (!token) {
    return { statusCode: 400, headers: { "Content-Type": "text/xml" }, body: "<Response><Say>Missing token.</Say></Response>" };
  }

  if (twilioConfigured() && event.httpMethod === "POST") {
    const params = formBody(event);
    const signature = event.headers["x-twilio-signature"] ?? event.headers["X-Twilio-Signature"];
    const url = `${siteUrl(event)}/api/twilio-voice-twiml?token=${encodeURIComponent(token)}`;
    if (!validateTwilioSignature(url, params, signature)) {
      return { statusCode: 403, body: "Forbidden" };
    }
  }

  const row = await consumeVoiceTwimlNonce(token);
  if (!row) {
    return { statusCode: 403, headers: { "Content-Type": "text/xml" }, body: "<Response><Say>Call expired.</Say></Response>" };
  }
  const data = await loadUserData(row.accountKey);
  const call = data?.tierA?.voiceCalls?.find((c) => c.id === row.callId);
  const script = call?.script ?? "Hello, this is Eric's assistant Iris with a quick message.";
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${escapeXml(script)}</Say></Response>`;
  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body };
};
