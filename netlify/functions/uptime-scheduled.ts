import type { Config, Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { listAllUserData } from "./_userData";
import { runWatchers } from "./_watchers";

/** Every 10 minutes: check uptime watchers (Uptime Kuma idea) and push when one goes down or comes back. */
export const config: Config = { schedule: "*/10 * * * *" };

export const handler: Handler = async (event) => {
  initBlobs(event);
  let checked = 0;
  for (const { sessionId, data } of await listAllUserData()) {
    const watchers = (data.hub as { watchers?: { uptime?: boolean }[] } | undefined)?.watchers ?? [];
    if (!watchers.some((w) => w.uptime)) continue;
    await runWatchers(sessionId, data, { notify: true, only: "uptime" });
    checked++;
  }
  return { statusCode: 200, body: JSON.stringify({ checked }) };
};
