import type { Config, Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { listAllUserData, loadUserData, saveUserData } from "./_userData";
import { googleCommute } from "./_commute";
import { inCommuteWindow } from "../../shared/commute";

/**
 * Every 15 minutes: on school mornings (the 4 hours before school starts),
 * fetch live drive time for each account that has addresses saved and save it.
 * Devices just read it; no phone asks Google itself.
 */
export const config: Config = { schedule: "*/15 * * * 1-5" };

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (!process.env.GOOGLE_MAPS_API_KEY) return { statusCode: 200, body: JSON.stringify({ skipped: "no GOOGLE_MAPS_API_KEY" }) };
  const now = new Date();
  let updated = 0;
  for (const { sessionId, data } of await listAllUserData()) {
    const s = data.settings;
    if (!s?.useLiveCommute || !s.homeAddress?.trim() || !s.schoolAddress?.trim() || !inCommuteWindow(s, now)) continue;
    const live = await googleCommute(s.homeAddress, s.schoolAddress);
    if (!live) continue;
    const latest = (await loadUserData(sessionId)) ?? data;
    await saveUserData(sessionId, { ...latest, liveCommute: live });
    updated++;
  }
  return { statusCode: 200, body: JSON.stringify({ updated }) };
};
