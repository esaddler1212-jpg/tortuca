/** Same key as Tortuca shell (`src/lib/storage.ts`) when Battleworld runs under games-hub. */
const SESSION_KEY = 'alfred-session-id';

export function tortucaSessionId(): string | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    return id && id.length > 8 ? id : null;
  } catch {
    return null;
  }
}

export function latticeRequestHeaders(): HeadersInit {
  const id = tortucaSessionId();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (id) h['X-Alfred-Session'] = id;
  return h;
}

export function latticeFetchHeaders(): HeadersInit {
  const id = tortucaSessionId();
  return id ? { 'X-Alfred-Session': id } : {};
}
