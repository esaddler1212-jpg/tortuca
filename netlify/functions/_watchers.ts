import { createHash } from "node:crypto";
import { evaluateCheck, evaluateUptime, pageText, newSnippet, type WatchResult, type Watcher } from "../../shared/hub";
import type { AlfredUserData } from "../../shared/userDataTypes";
import { fetchPublicText, probeUrl } from "./_fetchText";
import { loadUserData, pushAll, pushTargets, saveUserData } from "./_userData";

/** Check one user's watchers; save results; push an alert for each change. */
export async function runWatchers(
  key: string,
  data: AlfredUserData,
  opts: { notify: boolean; only?: "uptime" | "pages" },
): Promise<{ state: Record<string, WatchResult>; alerts: string[] }> {
  const all = ((data.hub as { watchers?: Watcher[] } | undefined)?.watchers ?? []).slice(0, 20);
  const watchers = all.filter((w) => (opts.only === "uptime" ? w.uptime : opts.only === "pages" ? !w.uptime : true));
  const prevState = (data.watchState ?? {}) as Record<string, WatchResult & { text?: string }>;
  // Start from the results we're not re-checking now (dropping deleted watchers).
  const keep = new Set(all.map((w) => w.id));
  const state: Record<string, WatchResult & { text?: string }> = Object.fromEntries(
    Object.entries(prevState).filter(([id]) => keep.has(id) && !watchers.some((w) => w.id === id)),
  );
  const alerts: string[] = [];
  const now = new Date().toISOString();

  await Promise.all(
    watchers.map(async (w) => {
      const prev = prevState[w.id];
      if (w.uptime) {
        const { result, alert } = evaluateUptime(w, prev, await probeUrl(w.url), now);
        state[w.id] = result;
        if (alert) alerts.push(alert);
        return;
      }
      try {
        const text = pageText(await fetchPublicText(w.url, 8000));
        const hash = createHash("sha256").update(text).digest("hex");
        const { result, alert } = evaluateCheck(w, prev, text, hash, now);
        if (alert && !w.lookFor && prev?.text) result.snippet = newSnippet(prev.text, text);
        // Keep a trimmed copy of the text so the next change can show what's new.
        state[w.id] = { ...result, text: text.slice(0, 20_000) };
        if (alert) alerts.push(alert);
      } catch (e) {
        state[w.id] = { ...(prev ?? {}), checkedAt: now, error: e instanceof Error ? e.message : "failed" };
      }
    }),
  );

  // Re-read so edits made while pages were loading aren't overwritten.
  const latest = (await loadUserData(key)) ?? data;
  // Save only what this run checked, on top of the latest saved results (the
  // uptime and page jobs can overlap), and drop results for deleted watchers.
  const checked = Object.fromEntries(watchers.filter((w) => state[w.id]).map((w) => [w.id, state[w.id]]));
  const merged = { ...((latest.watchState ?? {}) as Record<string, WatchResult>), ...checked };
  await saveUserData(key, { ...latest, watchState: Object.fromEntries(Object.entries(merged).filter(([id]) => keep.has(id))) });
  if (opts.notify && alerts.length && pushTargets(data).length && data.settings?.pushNotificationsEnabled) {
    await pushAll(data, {
      title: opts.only === "uptime" ? "IRIS · Uptime" : alerts.length === 1 ? "IRIS · Watcher" : `IRIS · ${alerts.length} watchers`,
      body: alerts.join(" · ").slice(0, 180),
      url: "/",
    });
  }
  return { state: stripText(state), alerts };
}

export function stripText(state: Record<string, WatchResult & { text?: string }>): Record<string, WatchResult> {
  return Object.fromEntries(Object.entries(state).map(([k, { text: _t, ...rest }]) => (void _t, [k, rest])));
}
