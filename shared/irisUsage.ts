/**
 * Iris usage log (Langfuse idea, without the extra service): one small record
 * per conversation turn with speed, tokens, tools and an estimated cost.
 * Privacy: never what E said or what Iris answered, only numbers and tool names.
 */

export interface IrisTrace {
  at: string;
  /** Wall time for the whole turn, ms. */
  ms: number;
  /** Model that actually served (fallbacks can switch it). */
  model: string;
  inTok: number;
  outTok: number;
  cacheRead: number;
  cacheWrite: number;
  searches: number;
  fetches: number;
  /** Custom tools Iris called this turn (add_todo, track_flight…). */
  tools: string[];
  /** API calls in the turn (tool results and long searches add hops). */
  hops: number;
  outcome: "ok" | "refused" | "timeout" | "rate_limited" | "error";
}

export interface IrisUsageMonth {
  month: string;
  /** Newest last; capped so the record stays small. */
  traces: IrisTrace[];
  /** Running totals per day (YYYY-MM-DD), so caps on `traces` don't lose counts. */
  days: Record<string, DayTotals>;
}

export interface DayTotals {
  calls: number;
  errors: number;
  cost: number;
  ms: number;
  inTok: number;
  outTok: number;
  cacheRead: number;
  searches: number;
}

/**
 * Per-million-token prices in dollars (Anthropic API list prices for the model
 * Iris uses). Web search is priced per 1,000 searches. These are estimates for
 * the dashboard: check the Claude Console for the real bill.
 */
export const PRICES: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-opus-5": { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-opus-4-8": { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
};
export const WEB_SEARCH_PER_1000 = 10;
const MAX_TRACES = 200;

export function traceCost(t: IrisTrace): number {
  const p = PRICES[t.model] ?? PRICES["claude-opus-5-5"];
  const tokens = (t.inTok * p.in + t.outTok * p.out + t.cacheRead * p.cacheRead + t.cacheWrite * p.cacheWrite) / 1_000_000;
  return tokens + (t.searches * WEB_SEARCH_PER_1000) / 1000;
}

export function emptyMonth(month: string): IrisUsageMonth {
  return { month, traces: [], days: {} };
}

/** Add one trace (pure: returns a new record). */
export function addTrace(log: IrisUsageMonth, t: IrisTrace, day: string): IrisUsageMonth {
  const d = log.days[day] ?? { calls: 0, errors: 0, cost: 0, ms: 0, inTok: 0, outTok: 0, cacheRead: 0, searches: 0 };
  return {
    ...log,
    traces: [...log.traces, t].slice(-MAX_TRACES),
    days: {
      ...log.days,
      [day]: {
        calls: d.calls + 1,
        errors: d.errors + (t.outcome === "ok" ? 0 : 1),
        cost: d.cost + traceCost(t),
        ms: d.ms + t.ms,
        inTok: d.inTok + t.inTok,
        outTok: d.outTok + t.outTok,
        cacheRead: d.cacheRead + t.cacheRead,
        searches: d.searches + t.searches,
      },
    },
  };
}

export interface UsageSummary {
  month: string;
  calls: number;
  today: number;
  errors: number;
  /** Estimated dollars this month, and at this pace by month end. */
  cost: number;
  projected: number;
  avgMs: number;
  /** Slowest of the recent turns, ms. */
  slowMs: number;
  /** Share of input served from the prompt cache (cheaper, faster), %. */
  cacheHit: number;
  searches: number;
  tools: Record<string, number>;
  /** Turns served by a fallback model (a safety decline on the main one). */
  fallbacks: number;
  recent: (IrisTrace & { cost: number })[];
}

export function summarize(log: IrisUsageMonth, today: string, mainModel = "claude-opus-5-5"): UsageSummary {
  const days = Object.values(log.days);
  const sum = (k: keyof DayTotals) => days.reduce((n, d) => n + d[k], 0);
  const calls = sum("calls");
  const cost = sum("cost");
  const inAll = sum("inTok") + sum("cacheRead");
  const [y, m] = log.month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dayOfMonth = today.startsWith(log.month) ? Number(today.slice(8, 10)) : daysInMonth;
  const tools: Record<string, number> = {};
  for (const t of log.traces) for (const name of t.tools) tools[name] = (tools[name] ?? 0) + 1;
  const ms = log.traces.map((t) => t.ms).sort((a, b) => a - b);
  return {
    month: log.month,
    calls,
    today: log.days[today]?.calls ?? 0,
    errors: sum("errors"),
    cost: round(cost, 2),
    projected: round(dayOfMonth ? (cost / dayOfMonth) * daysInMonth : cost, 2),
    avgMs: calls ? Math.round(sum("ms") / calls) : 0,
    slowMs: ms.length ? ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))] : 0,
    cacheHit: inAll ? Math.round((sum("cacheRead") / inAll) * 100) : 0,
    searches: sum("searches"),
    tools,
    fallbacks: log.traces.filter((t) => t.outcome === "ok" && t.model && t.model !== mainModel).length,
    recent: log.traces.slice(-12).reverse().map((t) => ({ ...t, cost: round(traceCost(t), 4) })),
  };
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
