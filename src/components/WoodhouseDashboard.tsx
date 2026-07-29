import { Package, RefreshCw, Users } from "lucide-react";
import type { WoodhouseSnapshotV2 } from "../types/woodhouse";

interface Props {
  snapshot: WoodhouseSnapshotV2 | null;
  source: "live" | "demo" | "proxy" | "backup" | null;
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

function syncLabel(source: Props["source"]): string {
  if (source === "live" || source === "proxy") return "synced";
  if (source === "backup") return "from latest Family Purpose backup";
  return "demo data";
}

export function WoodhouseDashboard({
  snapshot,
  source,
  loading,
  error,
  lastSync,
  onRefresh,
  onImportAction,
}: Props) {
  const store = snapshot?.store;
  const family = snapshot?.familyPurpose;
  const mergedActions = snapshot?.priorityActions ?? [];

  return (
    <section className="panel p-5 lg:col-span-2 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-alfred-gold">Woodhouse protocol</p>
          <h2 className="font-display text-xl font-semibold tracking-wide">
            {snapshot?.protocol ?? "woodhouse/v2"}
          </h2>
          <p className="text-xs text-alfred-mist">Orchestration · {syncLabel(source)}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={onRefresh} aria-label="Sync Woodhouse nodes">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {error && <p className="text-sm text-red-300/90">{error}</p>}

      {store && (
        <div>
          <div className="flex items-center gap-2 text-alfred-gold mb-3">
            <Package className="h-4 w-4" aria-hidden />
            <h3 className="font-medium">{store.storeName}</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="MTD revenue" value={formatMoney(store.metrics.monthToDateRevenue)} />
            <Metric label="Orders" value={String(store.metrics.monthToDateOrders)} />
            <Metric label="Goal" value={`${Math.round(store.metrics.goalProgressPercent)}%`} />
            <Metric
              label="Pending approvals"
              value={String(store.metrics.pendingApprovals)}
              highlight={store.metrics.pendingApprovals > 0}
            />
          </div>
        </div>
      )}

      {family && (
        <div className="border-t border-alfred-border pt-5">
          <div className="flex items-center gap-2 text-alfred-gold mb-3">
            <Users className="h-4 w-4" aria-hidden />
            <h3 className="font-medium">{family.appName}</h3>
            <span className="text-xs text-alfred-mist">
              {family.schoolDay.label} · {family.groupName}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 mb-4">
            <Metric label="Check-ins today" value={String(family.stats.checkInsToday)} />
            <Metric
              label="Follow-ups due"
              value={String(family.stats.followUpsDueToday)}
              highlight={family.stats.followUpsDueToday > 0}
            />
            <Metric
              label="Overdue"
              value={String(family.stats.followUpsOverdue)}
              highlight={family.stats.followUpsOverdue > 0}
            />
            <Metric label="Group meetings" value={String(family.stats.groupMeetingsToday)} />
          </div>
          <h4 className="text-xs uppercase tracking-wider text-alfred-mist mb-2">Today&apos;s calendar</h4>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {family.calendar
              .filter((item) => item.kind !== "school_day")
              .map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-alfred-border/60 bg-alfred-ink/40 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{item.title}</p>
                  {item.detail && <p className="text-xs text-alfred-mist mt-0.5">{item.detail}</p>}
                </li>
              ))}
          </ul>
        </div>
      )}

      {mergedActions.length > 0 && (
        <div className="border-t border-alfred-border pt-4">
          <h3 className="text-xs uppercase tracking-wider text-alfred-mist mb-2">Priority actions</h3>
          <ul className="space-y-2">
            {mergedActions.map((action) => (
              <li
                key={action}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-alfred-border/60 px-3 py-2 text-sm"
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
        <p className="text-xs text-alfred-mist">Last sync {lastSync.toLocaleTimeString()}</p>
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
