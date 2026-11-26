import { useMemo } from "react";
import { Target, Store, Image, Search } from "lucide-react";
import type { HubState } from "../../shared/hub";
import {
  REVENUE_TARGETS,
  SHOPIFY_LAUNCH_CHECKLIST,
  THUMBNAIL_PACKAGES,
  ensureRevenueOs,
  revenueMonthBreakdown,
  shopLaunchProgress,
  REVENUE_SCOUT_PRESET,
  type ShopifyLaunchCheckId,
} from "../../shared/revenueOs";
import type { ShopifyStoreSnapshot } from "../../shared/shopify";
import { shopifyReadiness } from "../../shared/shopify";
import type { HudModuleId } from "../../shared/hudModules";
import { stashResearchPrefill } from "../lib/researchPrefill";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function Bar({ pct, label, value }: { pct: number; label: string; value: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-mono mb-1">
        <span className="text-alfred-mist">{label}</span>
        <span className="text-cyan-100/90">{value}</span>
      </div>
      <div className="hud-bar h-2">
        <span style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export function RevenueOsPanel({
  hub,
  update,
  today,
  shopify,
  compact,
  onOpenModule,
}: {
  hub: HubState;
  update: (fn: (h: HubState) => HubState) => void;
  today: string;
  shopify?: ShopifyStoreSnapshot | null;
  compact?: boolean;
  onOpenModule?: (id: HudModuleId) => void;
}) {
  const month = today.slice(0, 7);
  const b = useMemo(() => revenueMonthBreakdown(hub.money, month), [hub.money, month]);
  const ros = ensureRevenueOs(hub.revenueOs);
  const launch = shopLaunchProgress(ros.launchChecklist);
  const shopReady = shopifyReadiness(shopify ?? undefined);
  const pkg = THUMBNAIL_PACKAGES.find((p) => p.id === ros.servicePackageId) ?? THUMBNAIL_PACKAGES[1];
  const totalPct = b.shortTarget ? Math.round((b.total / b.shortTarget) * 100) : 0;

  const toggleCheck = (id: ShopifyLaunchCheckId) => {
    update((h) => {
      const prev = ensureRevenueOs(h.revenueOs);
      const next = !prev.launchChecklist[id];
      return {
        ...h,
        revenueOs: { ...prev, launchChecklist: { ...prev.launchChecklist, [id]: next } },
      };
    });
  };

  const scout = () => {
    stashResearchPrefill(REVENUE_SCOUT_PRESET);
    onOpenModule?.("research");
  };

  return (
    <section
      className={`rounded-lg border border-alfred-gold/30 bg-amber-950/15 ${compact ? "px-3 py-2.5 space-y-2" : "px-4 py-3 space-y-3"}`}
      aria-label="Revenue OS"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="hud-label flex items-center gap-1.5 text-alfred-gold/90">
            <Target className="h-3.5 w-3.5" aria-hidden /> Revenue OS
          </p>
          {!compact ? (
            <p className="text-[11px] text-alfred-mist mt-1 leading-snug">
              Hybrid 60/40 · Thumbnails lead until Shopify launches · Bootstrap &lt;{money(REVENUE_TARGETS.bootstrapCapMonthly)}/mo ads
            </p>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-alfred-gold/80">→ {money(REVENUE_TARGETS.longMonthly)} long</span>
      </div>

      <Bar
        label={`Freedom ${money(b.shortTarget)}/mo`}
        value={`${money(b.total)} (${totalPct}%)`}
        pct={totalPct}
      />
      <div className={compact ? "space-y-1.5" : "grid gap-2 sm:grid-cols-2"}>
        <Bar
          label={`Shop ${money(b.shopTarget)}`}
          value={money(b.shop)}
          pct={b.shopTarget ? (b.shop / b.shopTarget) * 100 : 0}
        />
        <Bar
          label={`Thumbnails ${money(b.serviceTarget)}`}
          value={money(b.service)}
          pct={b.serviceTarget ? (b.service / b.serviceTarget) * 100 : 0}
        />
      </div>

      {b.gapShort > 0 ? (
        <p className="text-xs text-cyan-50/90 font-mono">
          Gap: {money(b.gapShort)} · {b.gapService > 0 ? `service ${money(b.gapService)}` : ""}
          {b.gapService > 0 && b.gapShop > 0 ? " · " : ""}
          {b.gapShop > 0 ? `shop ${money(b.gapShop)}` : ""}
        </p>
      ) : (
        <p className="text-xs text-emerald-300/90 font-mono">Short target hit this month — consider raising the ladder goal.</p>
      )}

      {!compact ? (
        <>
          <div className="rounded-md border border-cyan-400/20 bg-black/30 px-3 py-2 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/70 flex items-center gap-1">
              <Image className="h-3 w-3" aria-hidden /> Thumbnail offer
            </p>
            <PackagePicker
              selected={ros.servicePackageId ?? "standard"}
              onSelect={(id) =>
                update((h) => ({ ...h, revenueOs: { ...ensureRevenueOs(h.revenueOs), servicePackageId: id } }))
              }
            />
            <p className="text-[11px] text-alfred-mist">{pkg.deliverable}</p>
          </div>

          <div className="rounded-md border border-cyan-400/20 bg-black/30 px-3 py-2 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/70 flex items-center gap-1">
              <Store className="h-3 w-3" aria-hidden /> Shopify launch ({launch.done}/{launch.total})
            </p>
            <LaunchBar pct={launch.pct} />
            <ul className="space-y-1.5 text-xs">
              {SHOPIFY_LAUNCH_CHECKLIST.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-2 cursor-pointer text-alfred-mist hover:text-cyan-50">
                    <input
                      type="checkbox"
                      checked={Boolean(ros.launchChecklist[item.id])}
                      onChange={() => toggleCheck(item.id)}
                    />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-mono text-cyan-400/55">
              API readiness: {shopReady.ready ? "ready" : shopReady.items.join(" · ") || "not connected"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={scout} disabled={!onOpenModule}>
              <Search className="h-3.5 w-3.5 inline mr-1" aria-hidden />
              Scout: thumbnail pricing
            </button>
            {onOpenModule ? (
              <button type="button" className="btn-ghost text-xs" onClick={() => onOpenModule("hub")}>
                Log income in Hub Money
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-[11px] text-alfred-mist">
          Shop launch {launch.pct}% · {pkg.label} {money(pkg.price)} · Hub for checklist
        </p>
      )}
    </section>
  );
}

function LaunchBar({ pct }: { pct: number }) {
  return (
    <div className="hud-bar h-1.5">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

function PackagePicker({
  selected,
  onSelect,
}: {
  selected: (typeof THUMBNAIL_PACKAGES)[number]["id"];
  onSelect: (id: (typeof THUMBNAIL_PACKAGES)[number]["id"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {THUMBNAIL_PACKAGES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${
            selected === p.id ? "border-alfred-gold/60 text-alfred-gold" : "border-alfred-border/50 text-alfred-mist"
          }`}
          onClick={() => onSelect(p.id)}
        >
          {p.label} {money(p.price)}
        </button>
      ))}
    </div>
  );
}