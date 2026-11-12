/**
 * Installed iPhone/iPad PWAs stay alive in the background for days without
 * reloading, so a new deploy never reaches them until they are force-quit.
 * When IRIS returns to the foreground, compare our entry bundle with the live
 * index.html and reload if a newer build is published.
 */

const ENTRY = /\/assets\/index-[\w-]+\.js/;
const MIN_GAP_MS = 60_000;

function currentEntry(): string | null {
  const el = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]');
  return el?.getAttribute("src")?.match(ENTRY)?.[0] ?? null;
}

async function liveEntry(): Promise<string | null> {
  try {
    const res = await fetch("/", { cache: "no-store", headers: { Accept: "text/html" } });
    if (!res.ok) return null;
    return (await res.text()).match(ENTRY)?.[0] ?? null;
  } catch {
    return null;
  }
}

export function startAppUpdateWatch(): void {
  const mine = currentEntry();
  if (!mine) return;
  let lastCheck = Date.now();
  let checking = false;

  const check = async () => {
    if (checking || Date.now() - lastCheck < MIN_GAP_MS) return;
    checking = true;
    lastCheck = Date.now();
    const live = await liveEntry();
    checking = false;
    if (live && live !== mine) window.location.reload();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) void check();
  });
}
