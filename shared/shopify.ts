/** Easy Supply / Shopify store snapshot for IRIS and Woodhouse. */

export interface ShopifyProductVariant {
  id: number;
  title: string;
  price: string;
  sku?: string | null;
  inventory_quantity?: number | null;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  variants: ShopifyProductVariant[];
}

export interface ShopifyOrderSummary {
  id: number;
  name: string;
  totalPrice: string;
  financialStatus: string;
}

export interface ShopifyStoreSnapshot {
  configured: boolean;
  storeDomain?: string;
  adminUrl?: string;
  storefrontUrl?: string;
  products: ShopifyProduct[];
  openOrders: ShopifyOrderSummary[];
  message?: string;
}

export function shopifyContextForIris(s: ShopifyStoreSnapshot | null | undefined): string {
  if (!s?.configured) {
    return "Easy Supply Shopify: not connected yet — set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN in Netlify.";
  }
  const active = s.products.filter((p) => p.status === "active");
  const sweats = active.filter((p) => /sweat|suit|tracksuit|set/i.test(p.title));
  const inv = sweats.flatMap((p) => p.variants).reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0);
  const productLine =
    sweats.length > 0
      ? `Flagship sweatsuits: ${sweats.map((p) => p.title).slice(0, 3).join(", ")} (${inv} units in tracked variants).`
      : active.length
        ? `${active.length} active products (add sweatsuit SKUs in Shopify).`
        : "No active products in Shopify yet.";
  const orders =
    s.openOrders.length > 0
      ? `${s.openOrders.length} open order${s.openOrders.length === 1 ? "" : "s"} to fulfill (${s.openOrders
          .slice(0, 3)
          .map((o) => o.name)
          .join(", ")}).`
      : "No open orders waiting.";
  return `Easy Supply Shopify (${s.storeDomain}): ${productLine} ${orders}`;
}

export function shopifyReadiness(s: ShopifyStoreSnapshot | null | undefined): { ready: boolean; items: string[] } {
  if (!s?.configured) {
    return {
      ready: false,
      items: ["Add Shopify Admin API credentials in Netlify", "Publish sweatsuit products in Shopify Admin"],
    };
  }
  const items: string[] = [];
  const active = s.products.filter((p) => p.status === "active");
  if (!active.length) items.push("Activate at least one product (sweatsuit) in Shopify");
  const hasSweat = active.some((p) => /sweat|suit|tracksuit|set/i.test(p.title));
  if (!hasSweat) items.push("Add sweatsuit product listing with variants (size/color)");
  const hasInventory = active.some((p) => p.variants.some((v) => (v.inventory_quantity ?? 0) > 0));
  if (!hasInventory) items.push("Set inventory quantities on variants");
  if (!s.storefrontUrl) items.push("Connect custom domain or use *.myshopify.com storefront");
  return { ready: items.length === 0, items };
}
