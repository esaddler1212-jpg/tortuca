import { getStore } from "@netlify/blobs";

export interface StoredSession {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
  email?: string;
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
].join(" ");

export function sessionHeader(event: { headers: Record<string, string | undefined> }): string | null {
  const h = event.headers["x-alfred-session"] ?? event.headers["X-Alfred-Session"];
  return h ?? null;
}

export async function getSessionStore() {
  return getStore({ name: "alfred-sessions", consistency: "strong" });
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

export { SCOPES };
