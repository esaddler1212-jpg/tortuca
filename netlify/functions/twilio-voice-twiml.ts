import type { Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { loadUserData } from "./_userData";

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  const callId = event.queryStringParameters?.callId ?? "";
  const key = event.queryStringParameters?.key ?? "";
  if (!callId || !key) {
    return { statusCode: 400, headers: { "Content-Type": "text/xml" }, body: "<Response><Say>Missing call id.</Say></Response>" };
  }
  const data = await loadUserData(key);
  const call = data?.tierA?.voiceCalls?.find((c) => c.id === callId);
  const script = call?.script ?? "Hello, this is Eric's assistant Iris with a quick message.";
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${escapeXml(script)}</Say></Response>`;
  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body };
};
