import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { stocksBriefingLines } from "../lib/stocksBriefing";
import type { StocksSnapshot } from "../types/stocks";

interface Props {
  snapshot: StocksSnapshot | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

/** Compact AI/drone watchlist for Hub → Money (same data as Today markets). */
export function MoneyMarketUpdate({ snapshot, loading, error, onRefresh }: Props) {
  const movers = [...(snapshot?.watchlist ?? [])]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);
  const brief = stocksBriefingLines(snapshot ?? null);
  const source =
    snapshot?.dataSource === "finnhub" ? "Finnhub" : snapshot ? "Demo quotes" : null;

  return (
    <div className="rounded-md border border-emerald-400/20 bg-emerald-950/10 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/80">Stock market update</p>
        {onRefresh ? (
          <button type="button" className="btn-ghost p-1" onClick={onRefresh} disabled={loading} aria-label="Refresh markets">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        ) : null}
      </div>
      {source ? <p className="text-[10px] font-mono text-alfred-mist/80">{source}</p> : null}
      {error ? <p className="text-xs text-amber-200/90">{error}</p> : null}
      {loading && !snapshot ? (
        <p className="text-xs text-alfred-mist animate-pulse">Loading markets…</p>
      ) : null}
      {brief[0] ? <p className="text-xs text-cyan-50/90 leading-relaxed">{brief[0]}</p> : null}
      {movers.length > 0 ? (
        <ul className="space-y-1 border-t border-emerald-400/10 pt-2">
          {movers.map((q) => (
            <li key={q.symbol} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-mono text-cyan-50/95">{q.symbol}</span>
                <span className="text-alfred-mist ml-1">${q.price.toFixed(2)}</span>
              </span>
              <span className={`shrink-0 flex items-center gap-0.5 ${q.changePercent >= 0 ? "text-emerald-400/90" : "text-red-300/90"}`}>
                {q.changePercent >= 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
                {q.changePercent >= 0 ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      ) : !loading && !error ? (
        <p className="text-xs text-alfred-mist">No market data — check FINNHUB_API_KEY on Netlify.</p>
      ) : null}
      {brief.find((l) => l.startsWith("Upcoming IPO")) ? (
        <p className="text-[11px] text-alfred-mist border-t border-emerald-400/10 pt-2">{brief.find((l) => l.startsWith("Upcoming IPO"))}</p>
      ) : null}
    </div>
  );
}
