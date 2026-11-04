import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { authHeaders, ensureSession } from "../lib/google";
import type { UsageSummary } from "../../shared/irisUsage";

const TOOL_LABELS: Record<string, string> = {
  add_todo: "to-dos",
  remember: "remember",
  forget: "forget",
  open_planet: "open module",
  track_flight: "flights",
};

const money = (n: number) => (n < 0.01 && n > 0 ? "<$0.01" : `$${n.toFixed(2)}`);
const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** Settings: how Iris is doing this month (Langfuse idea): calls, speed, cost, errors. Numbers only. */
export function IrisUsagePanel({ googleConnected, timeZone }: { googleConnected: boolean; timeZone: string }) {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureSession();
      const res = await fetch(`/api/iris-usage?tz=${encodeURIComponent(timeZone)}`, { headers: authHeaders() });
      const body = (await res.json().catch(() => ({}))) as UsageSummary & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Couldn't load Iris's usage.");
      setData(body);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load Iris's usage.");
    } finally {
      setLoading(false);
    }
  }, [timeZone]);

  useEffect(() => {
    if (googleConnected) void load();
  }, [googleConnected, load]);

  if (!googleConnected) return <p className="text-sm text-alfred-mist">Connect Google to see Iris&apos;s usage.</p>;
  const tile = "rounded-md border border-alfred-border/60 px-2.5 py-2";
  const label = "font-mono text-[10px] uppercase text-alfred-mist";
  const used = data
    ? [
        data.searches ? `${data.searches} web search${data.searches === 1 ? "" : "es"}` : "",
        ...Object.entries(data.tools).map(([k, n]) => `${n} ${TOOL_LABELS[k] ?? k}`),
      ].filter(Boolean)
    : [];
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-alfred-mist">
          Every conversation turn: how fast she answered, what it cost and anything that went wrong. Only numbers are kept, never what you said.
        </p>
        <button type="button" className="btn-ghost shrink-0 p-1" onClick={() => void load()} aria-label="Refresh usage" disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {error && <p className="text-xs text-amber-300/90">{error}</p>}
      {data && !data.calls && <p className="text-sm text-alfred-mist">No conversations yet this month.</p>}
      {data && data.calls > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className={tile}>
              <p className={label}>This month</p>
              <p className="font-mono text-lg">{data.calls}</p>
              <p className="text-[11px] text-alfred-mist">turns · {data.today} today</p>
            </div>
            <div className={tile}>
              <p className={label}>Est. cost</p>
              <p className="font-mono text-lg">{money(data.cost)}</p>
              <p className="text-[11px] text-alfred-mist">on pace for {money(data.projected)}</p>
            </div>
            <div className={tile}>
              <p className={label}>Speed</p>
              <p className="font-mono text-lg">{secs(data.avgMs)}</p>
              <p className="text-[11px] text-alfred-mist">average · slowest {secs(data.slowMs)}</p>
            </div>
            <div className={tile}>
              <p className={label}>Health</p>
              <p className={`font-mono text-lg ${data.errors ? "text-amber-300" : ""}`}>
                {data.errors ? `${data.errors} error${data.errors === 1 ? "" : "s"}` : "No errors"}
              </p>
              <p className="text-[11px] text-alfred-mist">
                {data.cacheHit}% from cache{data.fallbacks ? ` · ${data.fallbacks} fallback` : ""}
              </p>
            </div>
          </div>
          {used.length > 0 && <p className="text-[11px] text-alfred-mist">Used: {used.join(" · ")}</p>}
          <ul className="space-y-1 font-mono text-[11px]">
            {data.recent.map((t) => (
              <li key={t.at + t.ms} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.outcome === "ok" ? "bg-emerald-400" : "bg-amber-300"}`} aria-hidden />
                  <span className="text-alfred-mist">
                    {new Date(t.at).toLocaleString("en-US", { timeZone, weekday: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="truncate">
                    {t.outcome === "ok"
                      ? [t.searches ? "search" : "", ...t.tools.map((x) => TOOL_LABELS[x] ?? x)].filter(Boolean).join(", ") || "chat"
                      : t.outcome.replace("_", " ")}
                  </span>
                </span>
                <span className="shrink-0 text-alfred-mist">
                  {secs(t.ms)} · {money(t.cost)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-alfred-mist">Estimated from Anthropic list prices. Your Claude Console bill is the real number.</p>
        </>
      )}
    </div>
  );
}
