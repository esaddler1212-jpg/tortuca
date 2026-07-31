import { getStore } from "@netlify/blobs";
import type { AlfredUserData } from "../../shared/userDataTypes";

const STORE = "alfred-user-data";

export async function getUserDataStore() {
  return getStore({ name: STORE, consistency: "strong" });
}

export async function loadUserData(sessionId: string): Promise<AlfredUserData | null> {
  const store = await getUserDataStore();
  const data = await store.get(sessionId, { type: "json" });
  return (data as AlfredUserData | null) ?? null;
}

export async function saveUserData(sessionId: string, data: AlfredUserData): Promise<void> {
  const store = await getUserDataStore();
  await store.setJSON(sessionId, { ...data, updatedAt: new Date().toISOString() });
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
