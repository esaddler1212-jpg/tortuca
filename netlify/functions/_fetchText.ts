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

/** Uptime probe: status code and response time, without downloading the page. */
export async function probeUrl(url: string, timeoutMs = 10_000): Promise<{ status?: number; ms?: number; error?: string }> {
  if (!isSafePublicUrl(url)) return { error: "URL not allowed" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IRISBot/1.0; uptime check)" },
    });
    const ms = Date.now() - started;
    await res.body?.cancel().catch(() => undefined);
    if (res.url && !isSafePublicUrl(res.url)) return { ms, error: "Redirected to a disallowed URL" };
    return { status: res.status, ms };
  } catch (e) {
    const aborted = ctrl.signal.aborted;
    return { ms: Date.now() - started, error: aborted ? "timed out" : e instanceof Error ? e.message.slice(0, 60) : "no answer" };
  } finally {
    clearTimeout(timer);
  }
}
