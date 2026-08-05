import { getSessionId, setSessionId } from "./storage";

function apiBase(): string {
  return "/api";
}

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

export async function startGoogleConnect(): Promise<void> {
  const sessionId = await ensureSession();
  window.location.href = `${apiBase()}/auth-start?session=${encodeURIComponent(sessionId)}`;
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
