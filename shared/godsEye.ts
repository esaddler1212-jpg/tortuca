/**
 * Link from the Bay Area Pulse to E's own God's Eye View globe (see
 * .claude/skills/gods-eye-view). The address is saved per device, because the
 * globe runs on one machine (e.g. the Chromebook at localhost:4173).
 * IRIS only opens the link; it never reads the globe's data or keys.
 */
export const GODS_EYE_KEY = "iris-gods-eye-url";
export const GODS_EYE_DEFAULT = "http://localhost:4173";

/** Accepts "localhost:4173", "192.168.1.20:4173" or a full http(s) URL. Returns null if it isn't one. */
export function normalizeGodsEyeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/:]+:\d+/.test(raw) ? raw : `http://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname || url.username || url.password) return null;
  return url.href.replace(/\/$/, "");
}

export function loadGodsEyeUrl(): string | null {
  try {
    return normalizeGodsEyeUrl(localStorage.getItem(GODS_EYE_KEY) ?? "");
  } catch {
    return null;
  }
}

export function saveGodsEyeUrl(url: string | null): void {
  try {
    if (url) localStorage.setItem(GODS_EYE_KEY, url);
    else localStorage.removeItem(GODS_EYE_KEY);
  } catch {
    /* private mode: link just won't persist */
  }
}
