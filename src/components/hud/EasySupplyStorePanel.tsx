import { ExternalLink, Package, RefreshCw, ShoppingBag } from "lucide-react";
import type { ShopifyStoreSnapshot } from "../../../shared/shopify";
import { shopifyReadiness } from "../../../shared/shopify";

interface Props {
  snapshot: ShopifyStoreSnapshot | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function EasySupplyStorePanel({ snapshot, loading, error, onRetry }: Props) {
  const readiness = shopifyReadiness(snapshot ?? undefined);
  const sweats =
    snapshot?.products.filter((p) => p.status === "active" && /sweat|suit|tracksuit|set/i.test(p.title)) ?? [];
  const sweatIds = new Set(sweats.map((p) => p.id));
  const otherActive = snapshot?.products.filter((p) => p.status === "active" && !sweatIds.has(p.id)) ?? [];

  return (
    <section className="panel-hud p-5 space-y-4 border-t border-cyan-400/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" aria-hidden /> Easy Supply · Shopify
          </p>
          <p className="text-sm text-alfred-mist mt-1">Read-only store ops for ~$80 sweatsuits — orders, inventory, launch checklist.</p>
        </div>
        {onRetry ? (
          <button type="button" className="btn-ghost text-xs shrink-0" onClick={onRetry} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 inline mr-1 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </button>
        ) : null}
      </div>

      {loading && !snapshot ? (
        <p className="font-mono text-[11px] text-cyan-400/50 animate-pulse">Loading Shopify…</p>
      ) : null}
      {error ? <p className="text-sm text-amber-200/90">{error}</p> : null}

      {!snapshot?.configured ? (
        <div className="rounded-md border border-amber-400/25 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          <p className="font-mono uppercase tracking-wider text-amber-300/80 text-[10px]">Setup</p>
          <ul className="mt-2 space-y-1 list-disc pl-4 text-alfred-mist">
            <li>Create a Shopify custom app with read_products, read_orders, read_inventory</li>
            <li>Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN in Netlify</li>
            <li>Optional: SHOPIFY_STOREFRONT_URL for customer-facing link</li>
          </ul>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            {snapshot.adminUrl ? (
              <a href={snapshot.adminUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:underline">
                Admin <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {snapshot.storefrontUrl ? (
              <a href={snapshot.storefrontUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:underline">
                Storefront <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            <span className="text-cyan-400/50 font-mono">{snapshot.storeDomain}</span>
          </div>

          <div
            className={`rounded-md border px-3 py-2 ${readiness.ready ? "border-emerald-400/30 bg-emerald-950/20" : "border-amber-400/25 bg-amber-950/15"}`}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/60">
              Launch readiness {readiness.ready ? "· OK" : "· gaps"}
            </p>
            {readiness.ready ? (
              <p className="text-xs text-emerald-100/90 mt-1">Products, inventory, and store connection look ready to sell sweatsuits.</p>
            ) : (
              <ul className="text-xs text-alfred-mist mt-1 list-disc pl-4 space-y-0.5">
                {readiness.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          {snapshot.openOrders.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/50">Open orders</p>
              <ul className="mt-1 space-y-1 text-xs">
                {snapshot.openOrders.map((o) => (
                  <li key={o.id} className="flex justify-between gap-2 text-cyan-50/90">
                    <span>{o.name}</span>
                    <span className="text-cyan-400/70">${o.totalPrice}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-alfred-mist font-mono">No open orders — fulfillment queue clear.</p>
          )}

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/50 flex items-center gap-1">
              <Package className="h-3 w-3" /> Sweatsuits &amp; products
            </p>
            <ul className="mt-2 space-y-2">
              {[...sweats, ...otherActive].slice(0, 8).map((p) => (
                <li key={p.id} className="rounded border border-cyan-400/15 bg-black/25 px-2 py-1.5">
                  <p className="text-sm text-cyan-50/95">{p.title}</p>
                  <p className="text-[10px] text-cyan-400/55 font-mono mt-0.5">
                    {p.variants
                      .slice(0, 4)
                      .map((v) => `${v.title} $${v.price}${v.inventory_quantity != null ? ` · ${v.inventory_quantity} in stock` : ""}`)
                      .join(" · ")}
                  </p>
                </li>
              ))}
              {!sweats.length && !otherActive.length ? (
                <li className="text-xs text-alfred-mist">No products returned — check API scopes or add listings in Shopify.</li>
              ) : null}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
