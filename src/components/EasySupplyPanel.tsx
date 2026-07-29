import { Package, RefreshCw } from "lucide-react";
import type { WoodhouseSnapshot } from "../types/woodhouse";

interface Props {
  snapshot: WoodhouseSnapshot | null;
  source: "live" | "demo" | "proxy" | null;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  onRefresh: () => void;
  onImportAction?: (title: string) => void;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function EasySupplyPanel({
  snapshot,
  source,
  loading,
  error,
  lastSync,
  onRefresh,
  onImportAction,
}: Props) {
  return (
    <section className="panel p-5 lg:col-span-2">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-alfred-gold">
          <Package className="h-5 w-5" aria-hidden />
          <div>
            <h2 className="font-display text-xl font-semibold tracking-wide">Easy Supply Co.</h2>
            <p className="text-xs text-alfred-mist font-sans normal-case tracking-normal">
              Woodhouse protocol · {source === "live" || source === "proxy" ? "synced" : "demo data"}
            </p>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onRefresh} aria-label="Sync Woodhouse node">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {error && <p className="text-sm text-red-300/90 mb-3">{error}</p>}

      {snapshot && (
        <div className="grid gap-4 md:grid-cols-4 mb-4">
          <Metric label="MTD revenue" value={formatMoney(snapshot.metrics.monthToDateRevenue)} />
          <Metric label="Orders" value={String(snapshot.metrics.monthToDateOrders)} />
          <Metric label="Goal progress" value={`${Math.round(snapshot.metrics.goalProgressPercent)}%`} />
          <Metric
            label="Pending approvals"
            value={String(snapshot.metrics.pendingApprovals)}
            highlight={snapshot.metrics.pendingApprovals > 0}
          />
        </div>
      )}

      {snapshot && snapshot.priorityActions.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-alfred-mist mb-2">Priority actions</h3>
          <ul className="space-y-2">
            {snapshot.priorityActions.map((action) => (
              <li
                key={action}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-alfred-border/60 bg-alfred-ink/40 px-3 py-2 text-sm"
              >
                <span>{action}</span>
                {onImportAction && (
                  <button type="button" className="btn-ghost text-xs py-1" onClick={() => onImportAction(action)}>
                    Add to tasks
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lastSync && (
        <p className="text-xs text-alfred-mist mt-4">
          Last sync {lastSync.toLocaleTimeString()}
          {snapshot ? ` · ${snapshot.storeName}` : ""}
        </p>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight ? "border-alfred-gold/50 bg-alfred-gold/5" : "border-alfred-border/60"
      }`}
    >
      <p className="text-xs text-alfred-mist">{label}</p>
      <p className={`font-display text-2xl ${highlight ? "text-alfred-gold" : ""}`}>{value}</p>
    </div>
  );
}
