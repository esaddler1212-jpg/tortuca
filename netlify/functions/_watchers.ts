import { createHash } from "node:crypto";
import { evaluateCheck, pageText, newSnippet, type WatchResult, type Watcher } from "../../shared/hub";
import type { AlfredUserData } from "../../shared/userDataTypes";
import { fetchPublicText } from "./_fetchText";
import { loadUserData, pushAll, pushTargets, saveUserData } from "./_userData";

/** Check one user's watchers; save results; push an alert for each change. */
export async function runWatchers(
  key: string,
  data: AlfredUserData,
  opts: { notify: boolean },
): Promise<{ state: Record<string, WatchResult>; alerts: string[] }> {
  const watchers = ((data.hub as { watchers?: Watcher[] } | undefined)?.watchers ?? []).slice(0, 20);
  const prevState = (data.watchState ?? {}) as Record<string, WatchResult & { text?: string }>;
  const state: Record<string, WatchResult & { text?: string }> = {};
  const alerts: string[] = [];
  const now = new Date().toISOString();

  await Promise.all(
    watchers.map(async (w) => {
      const prev = prevState[w.id];
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
  await saveUserData(key, { ...latest, watchState: state });
  if (opts.notify && alerts.length && pushTargets(data).length && data.settings?.pushNotificationsEnabled) {
    await pushAll(data, {
      title: alerts.length === 1 ? "Alfred · Watcher" : `Alfred · ${alerts.length} watchers`,
      body: alerts.join(" · ").slice(0, 180),
      url: "/",
    });
  }
  return { state: stripText(state), alerts };
}

export function stripText(state: Record<string, WatchResult & { text?: string }>): Record<string, WatchResult> {
  return Object.fromEntries(Object.entries(state).map(([k, { text: _t, ...rest }]) => (void _t, [k, rest])));
}
