/** PWA share target (?title=&text=&url=) — stash for Iris / Memos pick-up. */

export type ShareInboxPayload = { title?: string; text?: string; url?: string; at: string };

const KEY = "iris-share-inbox";

export function parseShareTargetParams(params: URLSearchParams): Omit<ShareInboxPayload, "at"> | null {
  const title = params.get("title")?.trim() || undefined;
  const text = params.get("text")?.trim() || undefined;
  const url = params.get("url")?.trim() || undefined;
  if (!title && !text && !url) return null;
  return { title, text, url };
}

export function stashShareInbox(payload: Omit<ShareInboxPayload, "at">): ShareInboxPayload {
  const full: ShareInboxPayload = { ...payload, at: new Date().toISOString() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    /* quota */
  }
  return full;
}

export function peekShareInbox(): ShareInboxPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShareInboxPayload;
  } catch {
    return null;
  }
}

export function clearShareInbox(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* */
  }
}