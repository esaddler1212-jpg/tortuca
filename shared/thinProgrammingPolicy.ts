/**
 * Policy lists for the thin-programming static auditor (`npm run test:thin`).
 * Update here when adding API routes or changing auth posture.
 */

/** Netlify function basenames that must validate session before side effects or private data. */
export const SESSION_REQUIRED_HANDLERS = [
  "ask",
  "business-research",
  "user-data",
  "shopify-store",
  "channel-send",
  "commute",
  "gmail",
  "calendar",
  "feed",
  "iris-memory",
  "iris-usage",
  "watch-now",
  "weekly-audit",
  "flight-nemulator-lattice",
] as const;

/** Intentionally callable without Google session (public data or OAuth setup). */
export const PUBLIC_API_HANDLERS = [
  "auth-start",
  "auth-callback",
  "google-oauth-status",
  "push-vapid",
  "pulse",
  "flight",
  "session",
  "woodhouse",
  "stocks",
] as const;

/**
 * When FINNHUB_API_KEY is set, /api/stocks must require a valid session
 * so anonymous traffic cannot burn the quota.
 */
export const STOCKS_LIVE_REQUIRES_SESSION = true;

/** Client calls that must send authHeaders() (X-Alfred-Session). */
export const CLIENT_FETCHES_REQUIRE_AUTH = [
  { file: "src/hooks/useConversation.ts", needle: "/api/ask", headerFn: "authHeaders" },
  { file: "src/lib/userData.ts", needle: "/api/user-data", headerFn: "authHeaders" },
  { file: "src/lib/businessResearch.ts", needle: "/api/business-research", headerFn: "authHeaders" },
  { file: "src/hooks/useShopifyStore.ts", needle: "/api/shopify-store", headerFn: "authHeaders" },
  { file: "src/hooks/useChannels.ts", needle: "/api/channel-send", headerFn: "authHeaders" },
  { file: "src/hooks/useCommute.ts", needle: "/api/commute", headerFn: "authHeaders" },
  { file: "src/lib/google.ts", needle: "/gmail", headerFn: "authHeaders" },
  { file: "src/hooks/useStocks.ts", needle: "/api/stocks", headerFn: "authHeaders" },
] as const;

/** Scheduled / background jobs that should exist in netlify/functions. */
export const SCHEDULED_HANDLERS = [
  "commute-scheduled",
  "reminder-check",
  "uptime-scheduled",
  "watchers-scheduled",
  "morning-digest",
  "weekly-audit-scheduled",
] as const;

export function handlerSourceRequiresSessionCheck(source: string): boolean {
  return /getValidSession/.test(source) && /401|Unauthorized|Connect Google|Session required/i.test(source);
}

export function handlerSourceGuardsLiveStocks(source: string): boolean {
  return /FINNHUB/.test(source) && /getValidSession|sessionHeader/.test(source);
}

export function handlerSourceSafeJsonBody(source: string): boolean {
  const hasParse = /JSON\.parse\s*\(\s*event\.body/.test(source);
  if (!hasParse) return true;
  return /try\s*\{[\s\S]*JSON\.parse\s*\(\s*event\.body/.test(source);
}
