import { isSafePublicUrl } from "../../shared/hub";

/** Fetch a public page/feed as text with a timeout and size cap. */
export async function fetchPublicText(url: string, timeoutMs = 8000, maxBytes = 1_500_000): Promise<string> {
  if (!isSafePublicUrl(url)) throw new Error("URL not allowed");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IRISBot/1.0; personal dashboard)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.url && !isSafePublicUrl(res.url)) throw new Error("Redirected to a disallowed URL");
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  } finally {
    clearTimeout(timer);
  }
}
