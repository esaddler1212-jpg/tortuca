import type { AlfredUserData } from "../../shared/userDataTypes";
import { fetchUserData } from "./userData";

/**
 * Keeps every open device current. When IRIS comes back on screen (you pick
 * up the Chromebook after using your phone) and every 90 s while it's open,
 * pull the account's data; if it changed since we last saw it, tell each part
 * of the app (to-dos, settings, plan, Hub, drafts, commute) to take it in.
 * Pulling on return happens before you can edit, so a stale device doesn't
 * overwrite newer changes.
 */
type Listener = (data: AlfredUserData) => void;
const listeners = new Set<Listener>();
let lastStamp = "";
let started = false;
let inFlight: Promise<void> | null = null;
const POLL_MS = 90_000;

export function onRemoteData(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pull now (deduped). `force` delivers even if nothing changed. */
export function pullRemote(force = false): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const data = await fetchUserData();
      if (!data) return;
      if (!force && data.updatedAt === lastStamp) return;
      lastStamp = data.updatedAt;
      listeners.forEach((l) => l(data));
    } catch {
      /* offline: try again next time */
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Note what we just saved, so our own write doesn't come back as "changed". */
export function markRemoteStamp(updatedAt: string) {
  lastStamp = updatedAt;
}

export function startRemoteSync() {
  if (started || typeof document === "undefined") return;
  started = true;
  const onShow = () => {
    if (document.visibilityState === "visible") void pullRemote();
  };
  document.addEventListener("visibilitychange", onShow);
  window.addEventListener("focus", onShow);
  window.addEventListener("online", onShow);
  setInterval(() => document.visibilityState === "visible" && void pullRemote(), POLL_MS);
}
