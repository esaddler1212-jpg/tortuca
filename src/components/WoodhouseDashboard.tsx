import { AlertCircle, CheckCircle2, Package, RefreshCw, Users, Box } from "lucide-react";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";

interface Props {
  snapshot: WoodhouseOrchestrationSnapshot | null;
  source: "live" | "demo" | "proxy" | "backup" | null;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  onRefresh: () => void;
  onImportAction?: (title: string) => void;
}

const TYPE_ICON: Record<string, typeof Package> = {
  commerce: Package,
  education: Users,
};

function syncLabel(source: Props["source"]): string {
  if (source === "live" || source === "proxy") return "all nodes synced";
  if (source === "backup") return "includes backup-backed nodes";
  return "demo nodes — register your apps in Settings";
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
  const nodes = snapshot?.nodes ?? [];
  const mergedActions = snapshot?.priorityActions ?? [];
  const online = nodes.filter((n) => n.ok).length;

  return (
    <section className="panel p-5 lg:col-span-2 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-alfred-gold">Woodhouse</p>
          <h2 className="font-display text-xl font-semibold tracking-wide">Your apps at a glance</h2>
          <p className="text-xs text-alfred-mist max-w-xl">
            Backend connection to everything you build. {nodes.length} registered · {online} online ·{" "}
            {syncLabel(source)}
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onRefresh} aria-label="Sync Woodhouse nodes">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {error && <p className="text-sm text-red-300/90">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {nodes.map((node) => (
          <NodeCard key={node.registryId} node={node} />
        ))}
        {nodes.length === 0 && (
          <p className="text-sm text-alfred-mist md:col-span-2">
            No Woodhouse nodes registered. Open Settings to add app URLs, or set{" "}
            <code className="text-alfred-cream/90">WOODHOUSE_NODES</code> on Netlify.
          </p>
        )}
      </div>

      {mergedActions.length > 0 && (
        <div className="border-t border-alfred-border pt-4">
          <h3 className="text-xs uppercase tracking-wider text-alfred-mist mb-2">Priority actions (all apps)</h3>
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
        <p className="text-xs text-alfred-mist">
          Last sync {lastSync.toLocaleTimeString()} · protocol {snapshot?.protocol}
        </p>
      )}
    </section>
  );
}

function NodeCard({ node }: { node: WoodhouseOrchestrationSnapshot["nodes"][number] }) {
  const Icon = TYPE_ICON[node.nodeType] ?? Box;
  const snap = node.snapshot;

  return (
    <article
      className={`rounded-xl border p-4 ${
        node.ok ? "border-alfred-border/80 bg-alfred-ink/30" : "border-red-400/40 bg-red-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-alfred-gold">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <div>
            <h3 className="font-medium text-alfred-cream">{node.displayName}</h3>
            <p className="text-xs text-alfred-mist capitalize">{node.nodeType}</p>
          </div>
        </div>
        {node.ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400/80 shrink-0" aria-label="Online" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-300 shrink-0" aria-label="Offline" />
        )}
      </div>

      {!node.ok && (
        <p className="text-xs text-red-300/90 mb-2">{node.error ?? "Could not reach node"}</p>
      )}

      {snap && (
        <>
          <p className="text-sm text-alfred-mist mb-3">{snap.summary}</p>
          {snap.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {snap.metrics.slice(0, 4).map((m) => (
                <div
                  key={m.key}
                  className={`rounded-lg border px-2 py-1.5 text-xs ${
                    m.alert ? "border-alfred-gold/50 bg-alfred-gold/5" : "border-alfred-border/50"
                  }`}
                >
                  <p className="text-alfred-mist">{m.label}</p>
                  <p className={`font-display text-lg ${m.alert ? "text-alfred-gold" : ""}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-alfred-mist mt-2 uppercase tracking-wider">
        {node.source}
        {node.baseUrl ? ` · ${node.baseUrl}` : ""}
      </p>
    </article>
  );
}
