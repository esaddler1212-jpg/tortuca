import { localHour } from "../../shared/timezone";
import type { Config, Handler } from "@netlify/functions";
import { buildMorningDigest } from "./_briefing";
import { accountKey, listAllUserData, saveUserData } from "./_userData";
import { getValidSession, initBlobs, listConnectedSessions, sendGmail } from "./_shared";

export const config: Config = {
  schedule: "0 * * * *",
};

function localDayKey(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/** Short stable id for logs (avoid raw session blob keys in scheduled output). */
function logRef(sessionId: string): string {
  return `…${sessionId.slice(-6)}`;
}

export const handler: Handler = async (event) => {
  initBlobs(event);

  const sessions = await listConnectedSessions();
  const userDataList = await listAllUserData();
  const dataBySession = new Map(userDataList.map((u) => [u.sessionId, u.data]));

  let sent = 0;
  const errors: string[] = [];

  const seen = new Set<string>();
  for (const { sessionId, session } of sessions) {
    // Data is shared per Google account; send one digest per account.
    const key = session.email ? accountKey(session.email) : sessionId;
    if (seen.has(key)) continue;
    const userData = dataBySession.get(key) ?? dataBySession.get(sessionId);
    if (userData) seen.add(key);
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
        await saveUserData(dataBySession.has(key) ? key : sessionId, { ...userData, lastDigestDate: today });
        sent++;
      } else {
        errors.push(`${logRef(sessionId)}: gmail send failed`);
      }
    } catch (e) {
      errors.push(`${logRef(sessionId)}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sent, errors }),
  };
};
