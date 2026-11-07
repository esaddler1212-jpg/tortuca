import { useCallback, useEffect, useState } from "react";
import { markLanternUnlockedToday } from "../../lib/hudPrefs";

/**
 * Daily unlock: charge the lantern (John's oath — see futurist-lantern/IRIS_OATH.md).
 * Iframe posts `{ type: 'iris:lantern-complete' }` when the oath finishes (see futurist-lantern/bootstrap patch).
 */
export function LanternUnlockGate({
  timezone,
  focusMode = "school",
  onUnlocked,
}: {
  timezone: string;
  /** Matches `html[data-focus]` — tints the 3D lantern to school / network / weekend palettes. */
  focusMode?: string;
  onUnlocked: () => void;
}) {
  const [lanternReady, setLanternReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/lantern/index.html", { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setLanternReady(r.ok);
      })
      .catch(() => {
        if (!cancelled) setLanternReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(() => {
    markLanternUnlockedToday(timezone);
    onUnlocked();
  }, [onUnlocked, timezone]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "iris:lantern-complete") complete();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [complete]);

  if (lanternReady === null) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black text-cyan-200/80 font-mono text-xs uppercase tracking-widest">
        Arming lantern…
      </div>
    );
  }

  if (!lanternReady) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/80">Lantern unlock</p>
        <p className="max-w-sm text-sm text-cyan-100/85">
          Run <code className="text-cyan-200">npm run lantern:bootstrap</code> once to copy Futurist Lantern into{" "}
          <code className="text-cyan-200">public/lantern/</code> (CC BY-NC — see futurist-lantern/README.md).
        </p>
        <button
          type="button"
          className="rounded-full border border-cyan-400/40 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100"
          onClick={complete}
        >
          Enter IRIS (skip)
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <iframe
        title="Lantern oath — charge to unlock IRIS"
        src={`/lantern/index.html?irisEmbed=1&irisTheme=${encodeURIComponent(focusMode)}`}
        className="h-full w-full border-0"
        allow="autoplay"
      />
      <button
        type="button"
        onClick={complete}
        className="absolute right-3 top-3 z-[61] rounded-full border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-[8px] uppercase tracking-widest text-slate-400"
      >
        Skip
      </button>
    </div>
  );
}
