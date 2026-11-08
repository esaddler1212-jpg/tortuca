/**
 * Paste a public http(s) URL from the clipboard — pattern inspired by
 * Cobalt web (imputnet/cobalt, MIT @imput/cobalt-client; main repo AGPL).
 */

const ALLOWED_TYPES = new Set(["text/plain", "text/uri-list"]);

/** First http(s) URL in clipboard text/uri-list, or null. */
export function parseHttpUrlFromText(text: string): string | null {
  const line = text.trim().split(/\s+/)[0] ?? "";
  if (!line) return null;
  try {
    const u = new URL(line);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

export async function readHttpLinkFromClipboard(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (!ALLOWED_TYPES.has(type)) continue;
        const blob = await item.getType(type);
        const href = parseHttpUrlFromText(await blob.text());
        if (href) return href;
      }
    }
  } catch {
    return null;
  }
  return null;
}
