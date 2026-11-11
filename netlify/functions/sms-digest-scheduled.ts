import type { Config, Handler } from "@netlify/functions";
import { localHour } from "../../shared/timezone";
import { initBlobs } from "./_shared";
import { listAllUserData, saveUserData } from "./_userData";
import { sendTwilioSms, twilioConfigured } from "./_twilio";
import { mergeTierA } from "../../shared/tierAOps";

export const config: Config = { schedule: "5 * * * *" };

function localDayKey(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (!twilioConfigured()) return { statusCode: 200, body: JSON.stringify({ sent: 0, skip: "twilio" }) };

  let sent = 0;
  const all = await listAllUserData();
  for (const { sessionId, data } of all) {
    const sms = data.tierA?.sms;
    if (!sms?.enabled || !sms.phoneE164) continue;
    const tz = data.settings?.timezone ?? "America/Los_Angeles";
    if (localHour(tz) !== (data.settings?.briefingHour ?? 7)) continue;
    const today = localDayKey(tz);
    if (sms.lastDigestDate === today) continue;

    const pending = (data.todos ?? []).filter((t) => !t.done).length;
    const unread = "Check IRIS Inbox for mail.";
    const commitments = (data.tierA?.commitments ?? []).filter((c) => !c.done).length;
    const text = [
      "IRIS morning SMS:",
      pending ? `${pending} open task(s).` : "Tasks clear.",
      commitments ? `${commitments} commitment(s) open.` : "",
      unread,
    ]
      .filter(Boolean)
      .join(" ");

    const ok = await sendTwilioSms(sms.phoneE164, text);
    if (ok) {
      const tierA = mergeTierA(data.tierA, {});
      tierA.sms = { ...tierA.sms!, lastDigestDate: today };
      await saveUserData(sessionId, { ...data, tierA, updatedAt: new Date().toISOString() });
      sent++;
    }
  }
  return { statusCode: 200, body: JSON.stringify({ sent }) };
};
