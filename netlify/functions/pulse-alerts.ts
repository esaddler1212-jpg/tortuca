import type { Config, Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { listAllUserData, pushAll, pushTargets, saveUserData } from "./_userData";
import { buildPulse } from "./_pulse";
import { pulseAlerts } from "../../shared/pulse";
import { dayKey } from "../../shared/timezone";

/** Every 20 minutes: push nearby quakes, wildfires, serious weather alerts and bad air (once each). */
export const config: Config = { schedule: "*/20 * * * *" };

export const handler: Handler = async (event) => {
  initBlobs(event);
  let sent = 0;
  for (const { sessionId: key, data } of await listAllUserData()) {
    const s = data.settings;
    if (!s?.pushNotificationsEnabled || !pushTargets(data).length) continue;
    if (!Number.isFinite(s.latitude) || !Number.isFinite(s.longitude)) continue;
    const snapshot = await buildPulse(s.latitude, s.longitude, { cams: false, flights: false });
    const seen = new Set(data.pulseSeen ?? []);
    const fresh = pulseAlerts(snapshot, new Date(), dayKey(s.timezone)).filter((a) => !seen.has(a.id));
    if (!fresh.length) continue;
    const ok = await pushAll(data, {
      title: fresh.length === 1 ? "Alfred · Bay Area Pulse" : `Alfred · ${fresh.length} Pulse alerts`,
      body: fresh.map((a) => a.text).join(" · ").slice(0, 180),
      url: "/",
    });
    if (ok) {
      await saveUserData(key, { ...data, pulseSeen: [...seen, ...fresh.map((a) => a.id)].slice(-200) });
      sent++;
    }
  }
  return { statusCode: 200, body: JSON.stringify({ sent }) };
};
