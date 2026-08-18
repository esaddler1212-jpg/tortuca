import { format, parseISO } from "date-fns";
import { Bot, Plane, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import type { IpoCandidate, StockQuote, StocksSnapshot } from "../types/stocks";

interface Props {
  snapshot: StocksSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function StocksPanel({ snapshot, loading, error, onRefresh }: Props) {
  const ai = snapshot?.watchlist.filter((q) => q.theme === "ai") ?? [];
  const drones = snapshot?.watchlist.filter((q) => q.theme === "drones") ?? [];

  return (
    <section className="panel p-5 lg:col-span-2">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-alfred-gold">Markets</p>
          <h2 className="font-display text-xl font-semibold tracking-wide">AI &amp; drone stocks</h2>
          <p className="text-xs text-alfred-mist">
            {snapshot?.dataSource === "finnhub" ? "Live via Finnhub" : "Demo data — set FINNHUB_API_KEY"}
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onRefresh} aria-label="Refresh stocks">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {error && <p className="text-sm text-red-300/90 mb-3">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <WatchlistBlock title="Artificial intelligence" icon={Bot} quotes={ai} />
        <WatchlistBlock title="Drones &amp; autonomy" icon={Plane} quotes={drones} />
      </div>

      <div className="mt-6 border-t border-alfred-border pt-4">
        <h3 className="text-xs uppercase tracking-wider text-alfred-mist mb-3">
          Potential tech IPOs (next 60 days)
        </h3>
        {snapshot?.upcomingIpos.length === 0 && !loading && (
          <p className="text-sm text-alfred-mist">No AI or drone-related IPOs on the calendar right now.</p>
        )}
        <ul className="space-y-2 max-h-52 overflow-y-auto">
          {snapshot?.upcomingIpos.map((ipo) => (
            <IpoRow key={`${ipo.symbol}-${ipo.date}`} ipo={ipo} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function WatchlistBlock({
  title,
  icon: Icon,
  quotes,
}: {
  title: string;
  icon: typeof Bot;
  quotes: StockQuote[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-alfred-gold mb-2">
        <Icon className="h-4 w-4" aria-hidden />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <ul className="space-y-2">
        {quotes.length === 0 && (
          <li className="text-sm text-alfred-mist">Loading watchlist…</li>
        )}
        {quotes.map((q) => (
          <li
            key={q.symbol}
            className="flex items-center justify-between gap-2 rounded-lg border border-alfred-border/60 bg-alfred-ink/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{q.symbol}</p>
              <p className="text-xs text-alfred-mist truncate">{q.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">${q.price.toFixed(2)}</p>
              <p
                className={`text-xs flex items-center justify-end gap-0.5 ${
                  q.changePercent >= 0 ? "text-emerald-400/90" : "text-red-300/90"
                }`}
              >
                {q.changePercent >= 0 ? (
                  <TrendingUp className="h-3 w-3" aria-hidden />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden />
                )}
                {q.changePercent >= 0 ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IpoRow({ ipo }: { ipo: IpoCandidate }) {
  return (
    <li className="rounded-lg border border-alfred-border/60 px-3 py-2 text-sm bg-alfred-ink/30">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-medium">
            {ipo.name}{" "}
            <span className="text-alfred-mist">({ipo.symbol})</span>
          </p>
          <p className="text-xs text-alfred-mist capitalize">
            {ipo.themes.join(" · ")} · {ipo.exchange} · {ipo.status}
          </p>
        </div>
        <div className="text-right text-xs text-alfred-mist">
          <p>{format(parseISO(ipo.date), "MMM d, yyyy")}</p>
          {ipo.priceRange && <p>{ipo.priceRange}</p>}
        </div>
      </div>
    </li>
  );
}
