import { getStore } from "@netlify/blobs";
import type { AlfredUserData, PushSubscriptionPayload } from "../../shared/userDataTypes";
import { loadSession } from "./_shared";
import { sendPush } from "./_push";

const STORE = "alfred-user-data";

export async function getUserDataStore() {
  return getStore({ name: STORE });
}

/** Data for a signed-in Google account lives under one key shared by all its devices. */
export function accountKey(email: string): string {
  return `acct:${email.trim().toLowerCase()}`;
}

/**
 * Where this device's data lives: the Google account once connected (so phone
 * and computer share it), otherwise the device's own session. The first time a
 * device connects, its old per-device data moves to the account (or, if the
 * account already has data, just its push subscription does).
 */
export async function resolveDataKey(sessionId: string): Promise<string> {
  const session = await loadSession(sessionId);
  if (!session?.refreshToken || !session.email) return sessionId;
  const key = accountKey(session.email);
  const store = await getUserDataStore();
  const own = (await store.get(sessionId, { type: "json" })) as AlfredUserData | null;
  if (own) {
    const acct = (await store.get(key, { type: "json" })) as AlfredUserData | null;
    if (!acct) {
      await store.setJSON(key, own);
    } else {
      await store.setJSON(key, { ...acct, pushSubscriptions: mergeSubs(pushTargets(acct), pushTargets(own)) });
    }
    await store.delete(sessionId);
  }
  return key;
}

export async function loadUserData(key: string): Promise<AlfredUserData | null> {
  const store = await getUserDataStore();
  const data = await store.get(key, { type: "json" });
  return (data as AlfredUserData | null) ?? null;
}

export async function saveUserData(key: string, data: AlfredUserData): Promise<void> {
  const store = await getUserDataStore();
  await store.setJSON(key, { ...data, updatedAt: new Date().toISOString() });
}

export async function listAllUserData(): Promise<Array<{ sessionId: string; data: AlfredUserData }>> {
  const store = await getUserDataStore();
  const { blobs } = await store.list();
  const results: Array<{ sessionId: string; data: AlfredUserData }> = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) results.push({ sessionId: blob.key, data: data as AlfredUserData });
  }
  return results;
}

// ── Push to every device that turned notifications on ─────────────────────

export function pushTargets(data: AlfredUserData): PushSubscriptionPayload[] {
  return mergeSubs(data.pushSubscriptions ?? [], data.pushSubscription ? [data.pushSubscription] : []);
}

export function mergeSubs(a: PushSubscriptionPayload[], b: PushSubscriptionPayload[]): PushSubscriptionPayload[] {
  const byEndpoint = new Map<string, PushSubscriptionPayload>();
  for (const s of [...a, ...b]) if (s?.endpoint) byEndpoint.set(s.endpoint, s);
  return [...byEndpoint.values()].slice(-6);
}

/** Send to all of the user's devices; true if any delivery worked. */
export async function pushAll(data: AlfredUserData, payload: { title: string; body: string; url?: string }): Promise<boolean> {
  const results = await Promise.all(pushTargets(data).map((s) => sendPush(s, payload)));
  return results.some(Boolean);
}
