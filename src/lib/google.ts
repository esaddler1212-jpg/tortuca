import { getSessionId, setSessionId } from "./storage";

function apiBase(): string {
  return "/api";
}

export type GoogleOAuthStatus = {
  configured?: boolean;
  redirectUri?: string;
  hint?: string;
};

export async function ensureSession(): Promise<string> {
  let id = getSessionId();
  if (id) return id;
  try {
    const res = await fetch(`${apiBase()}/session`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { sessionId: string };
      setSessionId(data.sessionId);
      return data.sessionId;
    }
  } catch {
    /* Netlify Functions unavailable in plain Vite dev */
  }
  id = crypto.randomUUID();
  setSessionId(id);
  return id;
}

export function authHeaders(): HeadersInit {
  const id = getSessionId();
  return id ? { "X-Alfred-Session": id } : {};
}

export async function fetchGoogleOAuthStatus(): Promise<GoogleOAuthStatus> {
  try {
    const res = await fetch(`${apiBase()}/google-oauth-status`);
    if (!res.ok) return {};
    return (await res.json()) as GoogleOAuthStatus;
  } catch {
    return {};
  }
}

export async function startGoogleConnect(): Promise<{ ok: boolean; error?: string }> {
  try {
    const status = await fetchGoogleOAuthStatus();
    if (status.configured === false) {
      return {
        ok: false,
        error:
          status.hint ??
          "Google OAuth is not configured on Netlify yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then redeploy.",
      };
    }
  } catch {
    return {
      ok: false,
      error:
        "Cannot reach Alfred's server functions. Are you on your Netlify URL (not localhost)? Try opening the deployed site.",
    };
  }

  const sessionId = await ensureSession();
  window.location.href = `${apiBase()}/auth-start?session=${encodeURIComponent(sessionId)}`;
  return { ok: true };
}

export async function fetchGoogleStatus(): Promise<{ connected: boolean; email?: string }> {
  const res = await fetch(`${apiBase()}/session`, { headers: authHeaders() });
  if (!res.ok) return { connected: false };
  return (await res.json()) as { connected: boolean; email?: string };
}

export async function disconnectGoogle(): Promise<void> {
  await fetch(`${apiBase()}/session`, { method: "DELETE", headers: authHeaders() });
}

export async function fetchEmails(): Promise<import("../types").EmailMessage[]> {
  const res = await fetch(`${apiBase()}/gmail`, { headers: authHeaders() });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load email");
  const data = (await res.json()) as { messages: import("../types").EmailMessage[] };
  return data.messages;
}

export async function fetchCalendarEvents(): Promise<import("../types").CalendarEvent[]> {
  const res = await fetch(`${apiBase()}/calendar`, { headers: authHeaders() });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load calendar");
  const data = (await res.json()) as { events: import("../types").CalendarEvent[] };
  return data.events;
}
