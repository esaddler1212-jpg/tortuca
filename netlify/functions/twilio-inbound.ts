import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildTierASmsContext } from "../../shared/tierASmsContext";
import { dayKey } from "../../shared/timezone";
import { TIER_A_SMS_DAILY_TURNS } from "../../shared/agentGuardrails";
import { mergeTierA, smsLinkCodeValid } from "../../shared/tierAOps";
import { getValidSession, initBlobs, listConnectedSessions, siteUrl } from "./_shared";
import { listAllUserData, loadUserData, saveUserData } from "./_userData";
import { sendTwilioSms, validateTwilioSignature, twilioConfigured } from "./_twilio";
import { smsAskOneTurn } from "./_tierASmsAsk";
import {
  allowSmsLinkAttempt,
  emailFromAccountKey,
  indexSmsPhone,
  recordSmsLinkFail,
  resolveAccountByPhone,
} from "./_tierASmsIndex";
import { fetchInboxHeadlines } from "./_tierASmsInbox";

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

async function sessionForEmail(email: string | null) {
  if (!email) return null;
  const sessions = await listConnectedSessions();
  const row = sessions.find((s) => s.session.email?.toLowerCase() === email.toLowerCase());
  if (!row) return null;
  return getValidSession(row.sessionId);
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
  const tzDefault = "America/Los_Angeles";

  if (linkMatch) {
    const code = linkMatch[1].toUpperCase();
    if (!(await allowSmsLinkAttempt(from, tzDefault))) {
      return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Too many tries. Wait until tomorrow.") };
    }
    const all = await listAllUserData();
    const hit = all.find((u) => smsLinkCodeValid(u.data.tierA?.sms, code));
    if (!hit) {
      await recordSmsLinkFail(from, tzDefault);
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/xml" },
        body: twiml("Unknown or expired link code. Get a fresh code in IRIS Today SMS."),
      };
    }
    const accountKey = hit.sessionId;
    const data = hit.data;
    const tierA = mergeTierA(data.tierA, {});
    tierA.sms = {
      ...tierA.sms,
      enabled: true,
      phoneE164: from,
      linkedAt: new Date().toISOString(),
      linkCode: undefined,
      linkCodeExpiresAt: undefined,
    };
    await saveUserData(accountKey, { ...data, tierA, updatedAt: new Date().toISOString() });
    await indexSmsPhone(from, accountKey);
    await sendTwilioSms(from, "IRIS linked. Text me any time for a short answer.");
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("You're linked. Text me anytime.") };
  }

  let accountKey = await resolveAccountByPhone(from);
  if (!accountKey) {
    const all = await listAllUserData();
    const match = all.find((u) => u.data.tierA?.sms?.enabled && u.data.tierA.sms.phoneE164 === from);
    if (match) {
      accountKey = match.sessionId;
      await indexSmsPhone(from, accountKey);
    }
  }
  if (!accountKey) {
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Unknown number. Link SMS in the IRIS app first.") };
  }

  const data = await loadUserData(accountKey);
  if (!data) {
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Account data missing. Open IRIS.") };
  }
  const tz = data.settings?.timezone ?? tzDefault;
  const emailAddr = emailFromAccountKey(accountKey);
  const who = (emailAddr ?? accountKey).toLowerCase();
  const usage = getStore({ name: "iris-sms-ask-usage" });
  const usageKey = `${who}:${dayKey(tz)}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  if (used >= TIER_A_SMS_DAILY_TURNS) {
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml("Daily SMS limit reached. Open IRIS.") };
  }
  await usage.set(usageKey, String(used + 1));

  const session = await sessionForEmail(emailAddr);
  let inbox: Awaited<ReturnType<typeof fetchInboxHeadlines>> = [];
  if (session?.accessToken) {
    try {
      inbox = await fetchInboxHeadlines(session);
    } catch {
      inbox = [];
    }
  }
  const schoolNames = data.settings?.schoolName ? [data.settings.schoolName] : [];
  const ctx = buildTierASmsContext(data, { timeZone: tz, schoolNames, inbox });
  const reply = await smsAskOneTurn(body, ctx);
  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml(reply) };
};
