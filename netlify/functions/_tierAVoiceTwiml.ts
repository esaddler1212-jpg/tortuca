import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE = "iris-voice-twiml";
const TTL_MS = 15 * 60 * 1000;

export function mintVoiceTwimlNonce(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function stashVoiceTwimlNonce(nonce: string, accountKey: string, callId: string): Promise<void> {
  const store = getStore({ name: STORE });
  await store.setJSON(nonce, { accountKey, callId, expiresAt: Date.now() + TTL_MS });
}

export async function consumeVoiceTwimlNonce(
  nonce: string,
): Promise<{ accountKey: string; callId: string } | null> {
  const store = getStore({ name: STORE });
  const row = (await store.get(nonce, { type: "json" })) as { accountKey: string; callId: string; expiresAt: number } | null;
  if (!row || Date.now() > row.expiresAt) {
    if (row) await store.delete(nonce);
    return null;
  }
  await store.delete(nonce);
  return { accountKey: row.accountKey, callId: row.callId };
}
