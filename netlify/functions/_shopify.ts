import type { ShopifyOrderSummary, ShopifyProduct, ShopifyStoreSnapshot } from "../../shared/shopify";

const API_VERSION = "2024-10";

function domainFromEnv(): string | null {
  const raw = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  if (!raw) return null;
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function shopifyGet<T>(path: string): Promise<T | null> {
  const domain = domainFromEnv();
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (!domain || !token) return null;
  const url = `https://${domain}/admin/api/${API_VERSION}${path}`;
  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function fetchShopifyStore(): Promise<ShopifyStoreSnapshot> {
  const domain = domainFromEnv();
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (!domain || !token) {
    return {
      configured: false,
      products: [],
      openOrders: [],
      message: "Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN on Netlify.",
    };
  }

  const storefrontUrl = process.env.SHOPIFY_STOREFRONT_URL?.trim() || `https://${domain.replace(/\.myshopify\.com$/i, "")}.myshopify.com`;

  const [productsJson, ordersJson] = await Promise.all([
    shopifyGet<{ products: Array<{ id: number; title: string; handle: string; status: string; variants: ShopifyProduct["variants"] }> }>(
      "/products.json?limit=25&fields=id,title,handle,status,variants",
    ),
    shopifyGet<{ orders: Array<{ id: number; name: string; total_price: string; financial_status: string }> }>(
      "/orders.json?status=open&limit=10&fields=id,name,total_price,financial_status",
    ),
  ]);

  const products: ShopifyProduct[] = (productsJson?.products ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    status: p.status,
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      sku: v.sku ?? null,
      inventory_quantity: v.inventory_quantity ?? null,
    })),
  }));

  const openOrders: ShopifyOrderSummary[] = (ordersJson?.orders ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    totalPrice: o.total_price,
    financialStatus: o.financial_status,
  }));

  return {
    configured: true,
    storeDomain: domain,
    adminUrl: `https://${domain}/admin`,
    storefrontUrl,
    products,
    openOrders,
  };
}
