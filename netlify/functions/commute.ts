import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { googleCommute } from "./_commute";
import { commuteMinutesFor } from "../../shared/commute";

/**
 * GET: the account's live commute (set by commute-scheduled) and whether live
 * traffic is configured. POST: refresh it now. Signed-in only, so nobody else
 * can spend the Google Maps key.
 */
export const handler: Handler = async (event) => {
  initBlobs(event);
  const json = (code: number, body: unknown) => ({ statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
  const sessionId = sessionHeader(event);
  if (!sessionId || !(await getValidSession(sessionId))) return json(401, { error: "Connect Google to use live commute." });
  const configured = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  const key = await resolveDataKey(sessionId);
  let data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const s = data.settings;

  if (event.httpMethod === "POST" && configured && s?.homeAddress && s.schoolAddress) {
    const live = await googleCommute(s.homeAddress, s.schoolAddress);
    if (live) {
      data = { ...((await loadUserData(key)) ?? data), liveCommute: live };
      await saveUserData(key, data);
    }
  } else if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return json(405, { error: "GET or POST" });
  }

  const live = data.liveCommute ?? null;
  return json(200, {
    configured,
    hasAddresses: Boolean(s?.homeAddress && s.schoolAddress),
    live,
    minutes: s ? commuteMinutesFor(s, live) : null,
  });
};
