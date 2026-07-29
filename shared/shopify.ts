import type {
  DailyRevenue,
  HealthSignal,
  MarketingIdea,
  ShopifyOrder,
  StoreMetrics,
  WoodhouseApprovalStatus,
} from "./types";
import { MONTHLY_SALES_GOAL, WOODHOUSE_TAG_APPROVED, WOODHOUSE_TAG_HELD } from "./types";

const API_VERSION = "2024-10";

export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN?.trim() &&
      process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim(),
  );
}

function shopifyBase(): string {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${domain}/admin/api/${API_VERSION}`;
}

function shopifyHeaders(): Record<string, string> {
  return {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
    "Content-Type": "application/json",
  };
}

async function shopifyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${shopifyBase()}${path}`, {
    ...init,
    headers: { ...shopifyHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function parseApprovalFromTags(tags: string): WoodhouseApprovalStatus {
  const list = tags.split(",").map((t) => t.trim().toLowerCase());
  if (list.includes(WOODHOUSE_TAG_APPROVED.toLowerCase())) return "approved";
  if (list.includes(WOODHOUSE_TAG_HELD.toLowerCase())) return "held";
  return "pending";
}

function mapOrder(raw: ShopifyRestOrder): ShopifyOrder {
  const tags = raw.tags ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  return {
    id: String(raw.id),
    name: raw.name,
    createdAt: raw.created_at,
    totalPrice: parseFloat(raw.total_price),
    subtotalPrice: parseFloat(raw.subtotal_price),
    currency: raw.currency,
    financialStatus: raw.financial_status,
    fulfillmentStatus: raw.fulfillment_status,
    customerName: raw.customer
      ? `${raw.customer.first_name ?? ""} ${raw.customer.last_name ?? ""}`.trim() || "Guest"
      : "Guest",
    customerEmail: raw.customer?.email ?? "",
    lineItems: (raw.line_items ?? []).map((li) => ({
      id: String(li.id),
      title: li.title,
      quantity: li.quantity,
      price: parseFloat(li.price),
    })),
    tags,
    woodhouseApproval: parseApprovalFromTags(raw.tags ?? ""),
  };
}

interface ShopifyRestOrder {
  id: number;
  name: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  tags: string;
  customer?: { first_name?: string; last_name?: string; email?: string };
  line_items?: { id: number; title: string; quantity: number; price: string }[];
}

let demoOrderCache: ShopifyOrder[] | null = null;

function getDemoOrders(): ShopifyOrder[] {
  if (!demoOrderCache) demoOrderCache = buildDemoOrders();
  return demoOrderCache;
}

export async function fetchOrders(limit = 50): Promise<ShopifyOrder[]> {
  if (!isShopifyConfigured()) return getDemoOrders().slice(0, limit);
  const data = await shopifyFetch<{ orders: ShopifyRestOrder[] }>(
    `/orders.json?status=any&limit=${limit}&order=created_at desc`,
  );
  return data.orders.map(mapOrder);
}

export async function setOrderApproval(
  orderId: string,
  status: WoodhouseApprovalStatus,
): Promise<ShopifyOrder> {
  if (!isShopifyConfigured()) {
    const orders = getDemoOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.woodhouseApproval = status;
    order.tags = tagsForApproval(status);
    return { ...order };
  }

  const { order: existing } = await shopifyFetch<{ order: ShopifyRestOrder }>(
    `/orders/${orderId}.json`,
  );
  const baseTags = (existing.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(
      (t) =>
        t &&
        !t.toLowerCase().startsWith("woodhouse:"),
    );
  const newTags = [...baseTags, ...tagsForApproval(status)].join(", ");

  const { order: updated } = await shopifyFetch<{ order: ShopifyRestOrder }>(
    `/orders/${orderId}.json`,
    {
      method: "PUT",
      body: JSON.stringify({ order: { id: orderId, tags: newTags } }),
    },
  );
  return mapOrder(updated);
}

function tagsForApproval(status: WoodhouseApprovalStatus): string[] {
  if (status === "approved") return [WOODHOUSE_TAG_APPROVED];
  if (status === "held") return [WOODHOUSE_TAG_HELD];
  return [];
}

export async function fetchStoreMetrics(): Promise<StoreMetrics> {
  if (!isShopifyConfigured()) return demoMetrics();

  const [shopRes, orders] = await Promise.all([
    shopifyFetch<{ shop: { name: string; currency: string } }>("/shop.json"),
    fetchOrders(100),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);
  const monthToDateRevenue = monthOrders.reduce((s, o) => s + o.totalPrice, 0);
  const monthToDateOrders = monthOrders.length;
  const averageOrderValue =
    monthToDateOrders > 0 ? monthToDateRevenue / monthToDateOrders : 0;
  const pendingApprovals = orders.filter((o) => o.woodhouseApproval === "pending").length;

  const dailyMap = new Map<string, DailyRevenue>();
  for (const o of monthOrders) {
    const date = o.createdAt.slice(0, 10);
    const cur = dailyMap.get(date) ?? { date, revenue: 0, orders: 0 };
    cur.revenue += o.totalPrice;
    cur.orders += 1;
    dailyMap.set(date, cur);
  }
  const dailyRevenue = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const productMap = new Map<string, { name: string; units: number; revenue: number }>();
  for (const o of monthOrders) {
    for (const li of o.lineItems) {
      const cur = productMap.get(li.title) ?? { name: li.title, units: 0, revenue: 0 };
      cur.units += li.quantity;
      cur.revenue += li.price * li.quantity;
      productMap.set(li.title, cur);
    }
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const goalProgressPercent = Math.min(100, (monthToDateRevenue / MONTHLY_SALES_GOAL) * 100);
  const revenueToGoal = Math.max(0, MONTHLY_SALES_GOAL - monthToDateRevenue);

  return {
    shopName: shopRes.shop.name,
    currency: shopRes.shop.currency,
    dataSource: "shopify",
    monthToDateRevenue,
    monthToDateOrders,
    averageOrderValue,
    pendingApprovals,
    goalProgressPercent,
    revenueToGoal,
    dailyRevenue,
    topProducts,
    health: buildHealthSignals({
      monthToDateRevenue,
      pendingApprovals,
      monthToDateOrders,
      revenueToGoal,
      dayOfMonth: now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    }),
  };
}

function buildHealthSignals(input: {
  monthToDateRevenue: number;
  pendingApprovals: number;
  monthToDateOrders: number;
  revenueToGoal: number;
  dayOfMonth: number;
  daysInMonth: number;
}): HealthSignal[] {
  const signals: HealthSignal[] = [];
  const pace =
    (input.monthToDateRevenue / input.dayOfMonth) *
    input.daysInMonth;

  if (input.pendingApprovals > 0) {
    signals.push({
      id: "pending-orders",
      severity: "action",
      title: `${input.pendingApprovals} order(s) need your approval`,
      detail: "Review the queue so fulfillment and cash flow do not stall.",
    });
  }

  if (pace >= MONTHLY_SALES_GOAL * 0.9) {
    signals.push({
      id: "pace-strong",
      severity: "good",
      title: "On pace for the $5k month",
      detail: `Projected month-end ~$${Math.round(pace).toLocaleString()} at current daily run rate.`,
    });
  } else if (pace < MONTHLY_SALES_GOAL * 0.5) {
    signals.push({
      id: "pace-weak",
      severity: "watch",
      title: "Behind the $5k pace",
      detail: `You need ~$${Math.round(input.revenueToGoal).toLocaleString()} more this month. Lean on marketing plays with high impact.`,
    });
  }

  if (input.monthToDateOrders === 0) {
    signals.push({
      id: "no-orders",
      severity: "action",
      title: "No orders yet this month",
      detail: "Ship one campaign this week: email, social proof post, or a small paid test.",
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "steady",
      severity: "good",
      title: "Store is moving",
      detail: "Keep approving orders quickly and test one new marketing idea per week.",
    });
  }

  return signals;
}

export function defaultMarketingIdeas(): MarketingIdea[] {
  return [
    {
      id: "m1",
      title: "Post-purchase email with 10% off next order",
      category: "email",
      effort: "low",
      impact: "medium",
      status: "idea",
      notes: "Use Shopify Email or Klaviyo; segment buyers from last 90 days.",
      estimatedMonthlyLift: 400,
    },
    {
      id: "m2",
      title: "UGC carousel on Instagram + link in bio refresh",
      category: "content",
      effort: "medium",
      impact: "medium",
      status: "planned",
      notes: "3 customer photos, 1 reel/week showing product in use.",
      estimatedMonthlyLift: 350,
    },
    {
      id: "m3",
      title: "$15/day Meta retargeting — site visitors 7d",
      category: "paid",
      effort: "medium",
      impact: "high",
      status: "idea",
      notes: "Start only after 500+ monthly sessions; cap spend until ROAS > 2.",
      estimatedMonthlyLift: 800,
    },
    {
      id: "m4",
      title: "Bundle slow mover with bestseller",
      category: "product",
      effort: "low",
      impact: "medium",
      status: "idea",
      notes: "Increase AOV 15–20% without discounting the hero SKU.",
      estimatedMonthlyLift: 500,
    },
    {
      id: "m5",
      title: "Local maker market pop-up + QR to store",
      category: "partnerships",
      effort: "high",
      impact: "medium",
      status: "idea",
      notes: "Collect emails on-site; offer first-time ship discount.",
      estimatedMonthlyLift: 600,
    },
  ];
}

function buildDemoOrders(): ShopifyOrder[] {
  const now = new Date();
  const d = (daysAgo: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() - daysAgo);
    return x.toISOString();
  };
  return [
    {
      id: "1001",
      name: "#ESC-1042",
      createdAt: d(0),
      totalPrice: 89.5,
      subtotalPrice: 82,
      currency: "USD",
      financialStatus: "paid",
      fulfillmentStatus: null,
      customerName: "Jordan Lee",
      customerEmail: "jordan@example.com",
      lineItems: [{ id: "1", title: "Starter Kit — Essentials", quantity: 1, price: 82 }],
      tags: [],
      woodhouseApproval: "pending",
    },
    {
      id: "1002",
      name: "#ESC-1041",
      createdAt: d(1),
      totalPrice: 156,
      subtotalPrice: 144,
      currency: "USD",
      financialStatus: "paid",
      fulfillmentStatus: "fulfilled",
      customerName: "Sam Rivera",
      customerEmail: "sam@example.com",
      lineItems: [
        { id: "2", title: "Refill Pack (3mo)", quantity: 2, price: 72 },
      ],
      tags: ["woodhouse:approved"],
      woodhouseApproval: "approved",
    },
    {
      id: "1003",
      name: "#ESC-1040",
      createdAt: d(2),
      totalPrice: 42,
      subtotalPrice: 38,
      currency: "USD",
      financialStatus: "paid",
      fulfillmentStatus: null,
      customerName: "Alex Kim",
      customerEmail: "alex@example.com",
      lineItems: [{ id: "3", title: "Travel Size Duo", quantity: 1, price: 38 }],
      tags: [],
      woodhouseApproval: "pending",
    },
    {
      id: "1004",
      name: "#ESC-1039",
      createdAt: d(4),
      totalPrice: 210,
      subtotalPrice: 195,
      currency: "USD",
      financialStatus: "pending",
      fulfillmentStatus: null,
      customerName: "Morgan Tate",
      customerEmail: "morgan@example.com",
      lineItems: [{ id: "4", title: "Wholesale Sample Box", quantity: 1, price: 195 }],
      tags: ["woodhouse:held"],
      woodhouseApproval: "held",
    },
  ];
}

function demoMetrics(): StoreMetrics {
  const orders = getDemoOrders();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);
  const monthToDateRevenue = monthOrders.reduce((s, o) => s + o.totalPrice, 0) + 1847.25;
  const monthToDateOrders = monthOrders.length + 18;
  const averageOrderValue = monthToDateRevenue / monthToDateOrders;
  const pendingApprovals = orders.filter((o) => o.woodhouseApproval === "pending").length;

  const dailyRevenue: DailyRevenue[] = [];
  for (let i = 14; i >= 0; i--) {
    const x = new Date(now);
    x.setDate(x.getDate() - i);
    dailyRevenue.push({
      date: x.toISOString().slice(0, 10),
      revenue: 80 + Math.round(Math.random() * 220),
      orders: 1 + Math.round(Math.random() * 4),
    });
  }

  return {
    shopName: "Easy Supply Co.",
    currency: "USD",
    dataSource: "demo",
    monthToDateRevenue,
    monthToDateOrders,
    averageOrderValue,
    pendingApprovals,
    goalProgressPercent: Math.min(100, (monthToDateRevenue / MONTHLY_SALES_GOAL) * 100),
    revenueToGoal: Math.max(0, MONTHLY_SALES_GOAL - monthToDateRevenue),
    dailyRevenue,
    topProducts: [
      { name: "Starter Kit — Essentials", units: 24, revenue: 1968 },
      { name: "Refill Pack (3mo)", units: 18, revenue: 1296 },
      { name: "Travel Size Duo", units: 31, revenue: 1178 },
    ],
    health: buildHealthSignals({
      monthToDateRevenue,
      pendingApprovals,
      monthToDateOrders,
      revenueToGoal: Math.max(0, MONTHLY_SALES_GOAL - monthToDateRevenue),
      dayOfMonth: now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    }),
  };
}
