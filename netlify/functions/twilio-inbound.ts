import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { dayKey } from "../../shared/timezone";
import { TIER_A_SMS_DAILY_TURNS } from "../../shared/agentGuardrails";
import { mergeTierA, tierAContextForIris } from "../../shared/tierAOps";
import { initBlobs, siteUrl } from "./_shared";
import { listAllUserData, saveUserData } from "./_userData";
import { sendTwilioSms, validateTwilioSignature, twilioConfigured } from "./_twilio";
import { smsAskOneTurn } from "./_tierASmsAsk";

function formBody(event: { body?: string | null; headers: Record<string, string | undefined> }): Record<string, string> {
  const raw = event.body ?? "";
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

function twiml(message: string) {
  const esc = message.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`;
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (!twilioConfigured()) {
    return { statusCode: 503, body: twiml("SMS not configured.") };
  }
  const params = formBody(event);
  const signature = event.headers["x-twilio-signature"] ?? event.headers["X-Twilio-Signature"];
  const url = `${siteUrl(event)}/api/twilio-inbound`;
  if (!validateTwilioSignature(url, params, signature)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const from = params.From ?? "";
  const body = (params.Body ?? "").trim();
  const linkMatch = /^LINK\s+(\w+)/i.exec(body);

  const all = await listAllUserData();
  let accountKey: string | null = null;
  let data = all[0]?.data;

  if (linkMatch) {
    const code = linkMatch[1].toUpperCase();
    const hit = all.find((u) => u.data.tierA?.sms?.linkCode?.toUpperCase() === code);
    if (hit) {
      accountKey = hit.sessionId;
      data = hit.data;
      const tierA = mergeTierA(data.tierA, {});
      tierA.sms = { ...tierA.sms, enabled: true, phoneE164: from, linkedAt: new Date().toISOString(), linkCode: tierA.sms?.linkCode };
      await saveUserData(accountKey, { ...data, tierA, updatedAt: new Date().toISOString() });
      await sendTwilioSms(from, "IRIS linked. Text me any time for a short answer.");
      return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("You're linked. Text me anytime.") };
    }
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Unknown link code. Get a fresh code in IRIS → Today → SMS.") };
  }

  const match = all.find((u) => u.data.tierA?.sms?.enabled && u.data.tierA.sms.phoneE164 === from);
  if (!match) {
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Unknown number. Link SMS in the IRIS app first.") };
  }
  accountKey = match.sessionId;
  data = match.data;
  const tz = data.settings?.timezone ?? "America/Los_Angeles";
  const who = match.sessionId;
  const usage = getStore({ name: "iris-sms-ask-usage" });
  const usageKey = `${who}:${dayKey(tz)}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  if (used >= TIER_A_SMS_DAILY_TURNS) {
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Daily SMS limit reached. Open IRIS.") };
  }
  await usage.set(usageKey, String(used + 1));

  const ctx = tierAContextForIris(data.tierA);
  const reply = await smsAskOneTurn(body, ctx);
  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml(reply) };
};
