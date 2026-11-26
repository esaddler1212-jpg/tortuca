/**
 * Sure (we-promise/sure) sidecar bridge — AGPL ledger on your VPS, not bundled in the PWA.
 * Hub Money stays the source for Revenue OS MTD; Sure adds accounts, budgets, and audit trail.
 */
export const SURE_ENV = {
  apiUrl: "SURE_API_URL",
  apiKey: "SURE_API_KEY",
} as const;

/** Map Tortuca Hub income labels → tags/categories to create in Sure (manual or n8n). */
/** Labels must match `shared/revenueOs.ts` income categories (avoids circular import). */
export const SURE_REVENUE_CATEGORY_HINTS = [
  { hubCategory: "Easy Supply", sureName: "Easy Supply", sureKind: "income" as const },
  { hubCategory: "Thumbnails", sureName: "Thumbnails", sureKind: "income" as const },
] as const;

export type SureSummarySnapshot = {
  configured: boolean;
  dataSource: "sure" | "unconfigured" | "error";
  fetchedAt?: string;
  accountCount?: number;
  /** Sum of latest balance amounts when Sure returns numeric balances */
  assetsTotal?: number;
  error?: string;
};

/** Read-only MCP tools Iris may suggest when Sure is on the Tailscale host (external to Netlify). */
export const SURE_MCP_READ_TOOLS = [
  "get_budget",
  "get_transactions",
  "get_income_statement",
  "get_insights",
  "get_uncategorized_transactions",
] as const;

export function sureSetupHintForIris(): string {
  return [
    "Sure ledger (optional): self-host we-promise/sure on the planned Woodhouse VPS (Tailscale).",
    "Netlify can read a read-only API key (SURE_API_URL + SURE_API_KEY) for account totals — never paste MCP write tokens into Iris memory.",
    `Revenue categories in Sure: ${SURE_REVENUE_CATEGORY_HINTS.map((c) => c.sureName).join(", ")} ↔ Hub Money.`,
    "While Shopify launch checklist is incomplete, treat Hub Money MTD as the Revenue OS source of truth; Sure reconciles cash and expenses.",
  ].join(" ");
}

export function sureSummaryLine(snap: SureSummarySnapshot | null | undefined): string {
  if (!snap?.configured || snap.dataSource !== "sure") return "";
  const parts = ["Sure (sidecar):"];
  if (snap.accountCount != null) parts.push(`${snap.accountCount} linked account(s).`);
  if (snap.assetsTotal != null) parts.push(`Latest balance total ~$${Math.round(snap.assetsTotal).toLocaleString("en-US")}.`);
  return parts.join(" ");
}

export function sureContextForIris(snap?: SureSummarySnapshot | null): string {
  const line = sureSummaryLine(snap);
  if (line) return `${line} ${sureSetupHintForIris()}`;
  return sureSetupHintForIris();
}