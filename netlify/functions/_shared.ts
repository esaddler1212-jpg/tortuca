import { connectLambda, getStore } from "@netlify/blobs";
import type { HandlerEvent } from "@netlify/functions";

export type BlobRequest = HandlerEvent & { blobs?: string };

/** Required for Netlify Functions v1 (Lambda compat) before any getStore() call. */
export function initBlobs(event: BlobRequest): void {
  if (event.blobs) {
    connectLambda(event);
  }
}

export interface StoredSession {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
  email?: string;
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
].join(" ");

export function sessionHeader(event: { headers: Record<string, string | undefined> }): string | null {
  const h = event.headers["x-alfred-session"] ?? event.headers["X-Alfred-Session"];
  return h ?? null;
}

export async function getSessionStore() {
  return getStore({ name: "alfred-sessions" });
}

export async function loadSession(sessionId: string): Promise<StoredSession | null> {
  const store = await getSessionStore();
  const data = await store.get(sessionId, { type: "json" });
  return (data as StoredSession | null) ?? null;
}

export async function saveSession(sessionId: string, data: StoredSession): Promise<void> {
  const store = await getSessionStore();
  await store.setJSON(sessionId, data);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const store = await getSessionStore();
  await store.delete(sessionId);
}

export function siteUrl(event: { headers: Record<string, string | undefined> }): string {
  const envUrl = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const host = event.headers.host ?? "localhost:8888";
  const proto = event.headers["x-forwarded-proto"] ?? "http";
  return `${proto}://${host}`;
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function refreshAccessToken(session: StoredSession): Promise<StoredSession> {
  if (Date.now() < session.expiresAt - 60_000) return session;

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: session.refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...session,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidSession(sessionId: string): Promise<StoredSession | null> {
  const existing = await loadSession(sessionId);
  if (!existing?.refreshToken) return null;
  const refreshed = await refreshAccessToken(existing);
  if (refreshed.accessToken !== existing.accessToken) {
    await saveSession(sessionId, refreshed);
  }
  return refreshed;
}

export async function listConnectedSessions(): Promise<Array<{ sessionId: string; session: StoredSession }>> {
  const store = await getSessionStore();
  const { blobs } = await store.list();
  const results: Array<{ sessionId: string; session: StoredSession }> = [];
  for (const blob of blobs) {
    const session = await store.get(blob.key, { type: "json" });
    const parsed = session as StoredSession | null;
    if (parsed?.refreshToken) {
      results.push({ sessionId: blob.key, session: parsed });
    }
  }
  return results;
}

export async function sendGmail(
  session: StoredSession,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="alfred-boundary"',
    "",
    "--alfred-boundary",
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
    "",
    "--alfred-boundary",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
    "",
    "--alfred-boundary--",
  ].join("\r\n");

  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });
  return res.ok;
}

export { SCOPES };
