import type { Config, Handler } from "@netlify/functions";
import { initBlobs } from "./_shared";
import { listAllUserData } from "./_userData";
import { runWatchers } from "./_watchers";

/** Every 3 hours: check everyone's watched pages and push alerts on changes. */
export const config: Config = { schedule: "17 */3 * * *" };

export const handler: Handler = async (event) => {
  initBlobs(event);
  let checked = 0;
  for (const { sessionId, data } of await listAllUserData()) {
    const watchers = (data.hub as { watchers?: unknown[] } | undefined)?.watchers ?? [];
    if (!watchers.length) continue;
    await runWatchers(sessionId, data, { notify: true });
    checked++;
  }
  return { statusCode: 200, body: JSON.stringify({ checked }) };
};
