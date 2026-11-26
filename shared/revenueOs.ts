/**
 * Revenue OS — freedom targets, hybrid split, Shopify launch checklist, thumbnail packages.
 * Synced via HubState.revenueOs; income tagged in Hub Money (Easy Supply + Thumbnails).
 */
import type { MoneyEntry } from "./hub";
import type { ShopifyStoreSnapshot } from "./shopify";
import { shopifyReadiness } from "./shopify";

export const REVENUE_TARGETS = {
  shortMonthly: 2_000,
  longMonthly: 10_000,
  shopShare: 0.6,
  serviceShare: 0.4,
  bootstrapCapMonthly: 200,
  hoursPerWeek: "11–15",
} as const;

export const SHOP_INCOME_CATEGORY = "Easy Supply" as const;
export const SERVICE_INCOME_CATEGORY = "Thumbnails" as const;

export const THUMBNAIL_PACKAGES = [
  { id: "starter", label: "Starter", price: 75, deliverable: "3 thumbnails · 1 revision round", clientsFor800: 11 },
  { id: "standard", label: "Standard", price: 125, deliverable: "5 thumbnails · 1 revision · 48–72h", clientsFor800: 7, recommended: true },
  { id: "pro", label: "Pro", price: 200, deliverable: "10 thumbnails · brand style sheet", clientsFor800: 4 },
] as const;

export const SHOPIFY_LAUNCH_CHECKLIST = [
  { id: "photos", label: "Hero product photos (phone OK)" },
  { id: "hero_sku", label: "1–2 live SKUs with variants (size/color)" },
  { id: "inventory", label: "Supplier/inventory counts verified" },
  { id: "shipping", label: "Shipping rates + policies published" },
  { id: "shopify_api", label: "Shopify connected in Netlify (read working)" },
  { id: "payout", label: "Payout/bank on Shopify" },
  { id: "soft_launch", label: "Soft launch post (organic, no big ad spend)" },
] as const;

export type ShopifyLaunchCheckId = (typeof SHOPIFY_LAUNCH_CHECKLIST)[number]["id"];

export interface RevenueOsState {
  launchChecklist: Partial<Record<ShopifyLaunchCheckId, boolean>>;
  /** Primary thumbnail package id */
  servicePackageId?: (typeof THUMBNAIL_PACKAGES)[number]["id"];
  /** Daily Jan 1 prep tasks — keys `YYYY-MM-DD:taskId` (see revenueActivationPlan.ts). */
  activationDone?: Record<string, boolean>;
}

export const DEFAULT_REVENUE_OS: RevenueOsState = {
  launchChecklist: {},
  servicePackageId: "standard",
};

export function ensureRevenueOs(raw?: RevenueOsState | null): RevenueOsState {
  return {
    ...DEFAULT_REVENUE_OS,
    ...raw,
    launchChecklist: { ...DEFAULT_REVENUE_OS.launchChecklist, ...raw?.launchChecklist },
    activationDone: { ...raw?.activationDone },
  };
}

export function shopLaunchProgress(checklist: Partial<Record<ShopifyLaunchCheckId, boolean>>): {
  done: number;
  total: number;
  pct: number;
  next?: string;
} {
  const total = SHOPIFY_LAUNCH_CHECKLIST.length;
  let done = 0;
  let next: string | undefined;
  for (const item of SHOPIFY_LAUNCH_CHECKLIST) {
    if (checklist[item.id]) done++;
    else if (!next) next = item.label;
  }
  return { done, total, pct: Math.round((done / total) * 100), next };
}

export function revenueMonthBreakdown(entries: MoneyEntry[], month: string) {
  const list = entries.filter((e) => e.date.startsWith(month) && e.kind === "in");
  const sum = (cat: string) => list.filter((e) => e.category === cat).reduce((n, e) => n + e.amount, 0);
  const shop = sum(SHOP_INCOME_CATEGORY);
  const service = sum(SERVICE_INCOME_CATEGORY);
  const other = list.reduce((n, e) => n + e.amount, 0) - shop - service;
  const total = shop + service + other;
  const t = REVENUE_TARGETS;
  const shopTarget = Math.round(t.shortMonthly * t.shopShare);
  const serviceTarget = Math.round(t.shortMonthly * t.serviceShare);
  return {
    total,
    shop,
    service,
    other,
    shopTarget,
    serviceTarget,
    shortTarget: t.shortMonthly,
    longTarget: t.longMonthly,
    gapShort: Math.max(0, t.shortMonthly - total),
    gapShop: Math.max(0, shopTarget - shop),
    gapService: Math.max(0, serviceTarget - service),
  };
}

/** One spoken + briefing line for Iris. */
export function revenueOsBriefLine(
  entries: MoneyEntry[],
  month: string,
  revenueOs?: RevenueOsState,
  shopify?: ShopifyStoreSnapshot | null,
): string {
  const b = revenueMonthBreakdown(entries, month);
  const shopReady = shopifyReadiness(shopify ?? undefined).ready;
  const chk = shopLaunchProgress(ensureRevenueOs(revenueOs).launchChecklist);
  const parts = [
    `Revenue this month: $${Math.round(b.total)} toward your $${b.shortTarget} freedom target`,
    b.gapService > 0 ? `thumbnails need $${Math.round(b.gapService)} more for the $${b.serviceTarget} service slice` : "",
    !shopReady || chk.pct < 100
      ? b.gapShop > 0
        ? "Easy Supply still in launch setup — thumbnails lead until checklist is done"
        : ""
      : b.gapShop > 0
        ? `shop needs $${Math.round(b.gapShop)} more for the $${b.shopTarget} product slice`
        : "",
  ].filter(Boolean);
  return parts[0] + (parts.length > 1 ? `. ${parts.slice(1).join(". ")}` : ".");
}

export function revenueContextForIris(
  entries: MoneyEntry[],
  month: string,
  revenueOs: RevenueOsState | undefined,
  shopify?: ShopifyStoreSnapshot | null,
): string {
  const b = revenueMonthBreakdown(entries, month);
  const launch = shopLaunchProgress(ensureRevenueOs(revenueOs).launchChecklist);
  const pkg = THUMBNAIL_PACKAGES.find((p) => p.id === ensureRevenueOs(revenueOs).servicePackageId) ?? THUMBNAIL_PACKAGES[1];
  const shop = shopifyReadiness(shopify ?? undefined);
  return [
    "Revenue OS (E's hybrid path):",
    `Targets: $${REVENUE_TARGETS.shortMonthly}/mo short, $${REVENUE_TARGETS.longMonthly}/mo long; 60% Easy Supply / 40% Thumbnails; bootstrap <~$${REVENUE_TARGETS.bootstrapCapMonthly}/mo ads.`,
    `MTD income: $${Math.round(b.total)} (shop $${Math.round(b.shop)}/$${b.shopTarget}, thumbnails $${Math.round(b.service)}/$${b.serviceTarget}).`,
    `Service offer: ${pkg.label} $${pkg.price} — ${pkg.deliverable}.`,
    `Shopify launch: ${launch.done}/${launch.total} checklist${launch.next ? `; next: ${launch.next}` : ""}. Shopify ready: ${shop.ready ? "yes" : "no"}.`,
    launch.pct < 100
      ? "While Shopify is not-ready, prioritize thumbnail clients first; do not recommend heavy ad spend."
      : "Shop may contribute; still gate spend and listing changes behind E's OK.",
  ].join(" ");
}

export const REVENUE_SCOUT_PRESET = {
  label: "Thumbnail pricing",
  area: "Personal" as const,
  template: "competitive" as const,
  query:
    "YouTube and short-form thumbnail creators: competitive pricing for 3–10 pack bundles, turnaround SLAs, niche positioning for film/gaming/Bay Area creators — what wins at $75–$200 price points?",
};