import type { Config, Handler } from "@netlify/functions";
import { buildMorningDigest } from "./_briefing";
import { listAllUserData, saveUserData } from "./_userData";
import { getValidSession, initBlobs, listConnectedSessions, sendGmail } from "./_shared";

export const config: Config = {
  schedule: "0 * * * *",
};

function localHour(timeZone: string, now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now),
  );
}

function localDayKey(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

export const handler: Handler = async (event) => {
  initBlobs(event);

  const sessions = await listConnectedSessions();
  const userDataList = await listAllUserData();
  const dataBySession = new Map(userDataList.map((u) => [u.sessionId, u.data]));

  let sent = 0;
  const errors: string[] = [];

  for (const { sessionId } of sessions) {
    const userData = dataBySession.get(sessionId);
    if (!userData?.settings?.morningDigestEnabled) continue;

    const tz = userData.settings.timezone;
    const hour = localHour(tz);
    if (hour !== userData.settings.briefingHour) continue;

    const today = localDayKey(tz);
    if (userData.lastDigestDate === today) continue;

    const validSession = await getValidSession(sessionId);
    if (!validSession?.email) continue;

    const digest = await buildMorningDigest(validSession, userData);
    if (!digest) continue;

    try {
      const ok = await sendGmail(validSession, validSession.email, digest.subject, digest.html, digest.text);
      if (ok) {
        await saveUserData(sessionId, { ...userData, lastDigestDate: today });
        sent++;
      } else {
        errors.push(`${sessionId}: gmail send failed`);
      }
    } catch (e) {
      errors.push(`${sessionId}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sent, errors }),
  };
};
