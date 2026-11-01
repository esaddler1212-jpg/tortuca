/**
 * Built-in Woodhouse node: ECS Network / Vantage roadmap.
 *
 * Turns dated milestones (from the Tortuga Productions 2027 plan) into a
 * woodhouse/node/v1 snapshot: what's active now, what's due within the
 * lookahead window, and countdowns to the big dates. Edit MILESTONES to update.
 */
import type { NodeSnapshot } from "./_woodhouse-registry";

export interface Milestone {
  id: string;
  division: "Tortuga Productions" | "Easy Supply Co." | "North Star Network" | "2EASY" | "ECS Network";
  title: string;
  /** Inclusive YYYY-MM-DD */
  start: string;
  /** Inclusive YYYY-MM-DD; omit for single-day milestones */
  end?: string;
  action?: string;
}

export const MILESTONES: Milestone[] = [
  {
    id: "bay-sponsor-pitch",
    division: "Tortuga Productions",
    title: "$BAY sponsor + grant pitching",
    start: "2026-12-01",
    end: "2027-01-31",
    action: "Pitch $BAY presenting, pop-up and episode sponsors; apply to city arts councils",
  },
  {
    id: "bay-concept-legal",
    division: "Tortuga Productions",
    title: "$BAY concept + legal locked",
    start: "2026-11-01",
    end: "2026-12-15",
    action: "Lock $BAY concept, releases and legal by mid-December",
  },
  {
    id: "bay-casting",
    division: "Tortuga Productions",
    title: "$BAY casting (7 participants)",
    start: "2027-01-01",
    end: "2027-02-28",
    action: "Cast $BAY participants for all seven cities",
  },
  {
    id: "bay-test-spend",
    division: "Tortuga Productions",
    title: "$BAY test spend (Insta360 Go 3 rental)",
    start: "2027-02-01",
    end: "2027-02-28",
    action: "Book the 3-day Insta360 Go 3 test rental",
  },
  {
    id: "bay-shoot",
    division: "Tortuga Productions",
    title: "$BAY shoot: Saturdays, one city a week",
    start: "2027-03-06",
    end: "2027-05-01",
    action: "Prep this Saturday's $BAY city shoot",
  },
  {
    id: "festival-eligibility",
    division: "Tortuga Productions",
    title: "Ask SFFILM + DocLands about Director's Cut eligibility",
    start: "2027-05-15",
    end: "2027-06-11",
    action: "Email SFFILM and DocLands before $BAY episodes go public",
  },
  {
    id: "bay-season",
    division: "Tortuga Productions",
    title: "$BAY season: weekly YouTube drops",
    start: "2027-06-12",
    end: "2027-07-31",
    action: "Publish this week's $BAY episode, vertical cuts and city-edition merch",
  },
  {
    id: "bay-popup",
    division: "Tortuga Productions",
    title: "$BAY Fourth of July pop-up",
    start: "2027-07-03",
    action: "Run the July 3 pop-up and film the recap",
  },
  {
    id: "recluse",
    division: "Tortuga Productions",
    title: "Recluse Without a Cause (short film)",
    start: "2027-08-01",
    end: "2027-08-31",
    action: "Produce Recluse Without a Cause; cut the $BAY sizzle reel",
  },
  {
    id: "cinequest-submit",
    division: "Tortuga Productions",
    title: "Cinequest submission window",
    start: "2027-08-01",
    end: "2027-11-30",
    action: "Submit $BAY Director's Cut / Recluse to Cinequest",
  },
  {
    id: "sffilm-submit",
    division: "Tortuga Productions",
    title: "SFFILM submission window",
    start: "2027-09-01",
    end: "2027-12-31",
    action: "Submit to SFFILM (if eligible)",
  },
  {
    id: "sample-sales-2027",
    division: "2EASY",
    title: "Sample Sales (Q2 & Q3)",
    start: "2027-04-01",
    end: "2027-09-30",
  },
];

const DAY_MS = 86_400_000;

/** Today's date (YYYY-MM-DD) in the given time zone. */
function todayIn(tz: string, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round((Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`)) / DAY_MS);
}

export function buildEcsRoadmapNode(
  now: Date = new Date(),
  tz = "America/Los_Angeles",
  lookaheadDays = 14,
  milestones: Milestone[] = MILESTONES,
): NodeSnapshot {
  const today = todayIn(tz, now);

  const active = milestones.filter((m) => m.start <= today && (m.end ?? m.start) >= today);
  const upcoming = milestones
    .filter((m) => m.start > today && daysBetween(today, m.start) <= lookaheadDays)
    .sort((a, b) => a.start.localeCompare(b.start));
  const next = milestones
    .filter((m) => m.start > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  const priorityActions = [
    ...active.filter((m) => m.action).map((m) => m.action!),
    ...upcoming
      .filter((m) => m.action)
      .map((m) => `${m.action} (starts in ${daysBetween(today, m.start)}d)`),
  ];

  const calendar = [...active, ...upcoming]
    .filter((m) => m.start === today || m.end === today)
    .map((m) => ({
      id: `ecs-${m.id}`,
      kind: m.end === today && m.start !== today ? "deadline" : "milestone",
      title: m.end === today && m.start !== today ? `Last day: ${m.title}` : m.title,
      start: `${today}T09:00:00`,
      detail: m.division,
    }));

  const countdown = (id: string, label: string) => {
    const m = milestones.find((x) => x.id === id);
    if (!m) return null;
    const d = daysBetween(today, m.start);
    return { key: id, label, value: d > 0 ? `${d}d` : d === 0 ? "today" : "underway", alert: d >= 0 && d <= 7 };
  };

  const metrics = [
    { key: "active", label: "Active milestones", value: active.length },
    { key: "upcoming", label: `Starting in ${lookaheadDays}d`, value: upcoming.length, alert: upcoming.length > 0 },
    countdown("bay-shoot", "$BAY shoot"),
    countdown("bay-season", "$BAY premiere"),
  ].filter((m): m is NonNullable<typeof m> => m !== null);

  const summary = active.length
    ? `Now: ${active.map((m) => m.title).join("; ")}`
    : next
      ? `Next: ${next.title} in ${daysBetween(today, next.start)} days`
      : "No upcoming roadmap milestones";

  return {
    protocol: "woodhouse/node/v1",
    nodeId: "ecs-roadmap",
    nodeType: "ops",
    displayName: "ECS Network roadmap",
    generatedAt: now.toISOString(),
    status: "ok",
    summary,
    metrics,
    calendar,
    priorityActions,
  };
}

// ─── Revenue goal ladder ─────────────────────────────────────────────
// Start small and climb toward the long-term $100K/month target.
// The current monthly goal comes from WOODHOUSE_REVENUE_GOAL (default $1,000).
export const REVENUE_LADDER = [1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000];
export const LONG_TERM_MONTHLY_GOAL = 100_000;

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Sum numeric `revenue` metrics from nodes with real (non-demo) data. */
export function totalLiveRevenue(
  nodes: Array<{ source: string; snapshot: NodeSnapshot | null }>,
): number | null {
  let total = 0;
  let found = false;
  for (const n of nodes) {
    if (n.source === "demo" || !n.snapshot) continue;
    for (const m of n.snapshot.metrics) {
      if (m.key === "revenue" && typeof m.value === "number" && Number.isFinite(m.value)) {
        total += m.value;
        found = true;
      }
    }
  }
  return found ? total : null;
}

/** Next ladder step above `goal` (or the long-term goal). */
export function nextLadderStep(goal: number): number {
  return REVENUE_LADDER.find((g) => g > goal) ?? LONG_TERM_MONTHLY_GOAL;
}

/**
 * Add month-to-date revenue vs. goal to the roadmap node. `revenue` null means
 * no app reports live revenue yet; the node says so instead of guessing.
 */
export function applyRevenueGoal(
  node: NodeSnapshot,
  revenue: number | null,
  goal: number,
  now: Date = new Date(),
  tz = "America/Los_Angeles",
): NodeSnapshot {
  const [y, mo, d] = todayIn(tz, now).split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const daysLeft = daysInMonth - d;

  if (revenue === null) {
    return {
      ...node,
      metrics: [
        ...node.metrics,
        { key: "revenue-goal", label: "Monthly goal", value: `${usd(goal)} (no revenue data yet)` },
      ],
    };
  }

  const pct = Math.round((revenue / goal) * 100);
  const expected = (goal * d) / daysInMonth;
  const behind = revenue < expected * 0.8;
  const hit = revenue >= goal;
  const actions = [...node.priorityActions];
  if (hit) {
    actions.unshift(
      `Monthly goal hit (${usd(revenue)} of ${usd(goal)}). Raise the goal to ${usd(nextLadderStep(goal))} next month`,
    );
  } else if (behind) {
    actions.push(
      `Revenue behind pace: ${usd(revenue)} of ${usd(goal)} with ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
    );
  }

  return {
    ...node,
    summary: `${node.summary} · Revenue ${usd(revenue)} of ${usd(goal)} (${pct}%)`,
    metrics: [
      ...node.metrics,
      { key: "revenue-mtd", label: "Revenue this month", value: usd(revenue) },
      { key: "revenue-goal", label: `Goal ${usd(goal)}`, value: `${pct}%`, alert: behind && !hit },
      {
        key: "revenue-long-term",
        label: `${usd(LONG_TERM_MONTHLY_GOAL)}/mo target`,
        value: `${((revenue / LONG_TERM_MONTHLY_GOAL) * 100).toFixed(1)}%`,
      },
    ],
    priorityActions: actions,
  };
}

export function revenueGoalFromEnv(): number {
  const raw = Number(process.env.WOODHOUSE_REVENUE_GOAL?.replace(/[$,\s]/g, ""));
  return Number.isFinite(raw) && raw > 0 ? raw : REVENUE_LADDER[0];
}
