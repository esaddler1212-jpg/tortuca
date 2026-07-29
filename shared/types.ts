export const MONTHLY_SALES_GOAL = 5000;

export type WoodhouseApprovalStatus = "pending" | "approved" | "held";

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  subtotalPrice: number;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  customerName: string;
  customerEmail: string;
  lineItems: ShopifyLineItem[];
  tags: string[];
  woodhouseApproval: WoodhouseApprovalStatus;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface StoreMetrics {
  shopName: string;
  currency: string;
  dataSource: "shopify" | "demo";
  monthToDateRevenue: number;
  monthToDateOrders: number;
  averageOrderValue: number;
  pendingApprovals: number;
  goalProgressPercent: number;
  revenueToGoal: number;
  dailyRevenue: DailyRevenue[];
  topProducts: { name: string; units: number; revenue: number }[];
  health: HealthSignal[];
}

export interface HealthSignal {
  id: string;
  severity: "good" | "watch" | "action";
  title: string;
  detail: string;
}

export interface MarketingIdea {
  id: string;
  title: string;
  category: "content" | "paid" | "email" | "partnerships" | "product" | "ops";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  status: "idea" | "planned" | "in_progress" | "done";
  notes: string;
  estimatedMonthlyLift?: number;
}

export interface WoodhouseSnapshot {
  protocol: "woodhouse/v1";
  storeId: string;
  storeName: string;
  generatedAt: string;
  metrics: Pick<
    StoreMetrics,
    | "monthToDateRevenue"
    | "monthToDateOrders"
    | "goalProgressPercent"
    | "pendingApprovals"
  >;
  pendingOrderIds: string[];
  priorityActions: string[];
}

export const WOODHOUSE_TAG_APPROVED = "woodhouse:approved";
export const WOODHOUSE_TAG_HELD = "woodhouse:held";
