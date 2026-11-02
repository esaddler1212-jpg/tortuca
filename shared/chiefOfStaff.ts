/**
 * ECS Chief of Staff (pure, testable; shared by the app, the /api/cos
 * endpoint and the agent prompts).
 *
 * The system of record for running ECS Network week to week:
 *   - Commitments: what E owes people and what people owe E, with due dates
 *   - Decisions: what was decided, why, and when to revisit
 *   - Weekly rhythm: Monday kickoff (top 3) and Friday close (win / learn)
 *   - Division scorecard: plan tasks, roadmap, revenue and commitments per
 *     division, with an auto red/yellow/green E can override
 *   - Inbox: memos and suggested commitments posted by the CoS agent
 */
import type { Area } from "./planData";
import { allTasks, isDone, monthKey, type PlanState } from "./plan";
import { MILESTONES, type Milestone } from "./ecsMilestones";
import { moneyMonth, type HubState } from "./hub";
import { addDays, weekdayOfDay } from "./timezone";

export type Division = Exclude<Area, "Personal">;
export const DIVISIONS: Division[] = ["ECS", "Tortuga", "Easy Supply", "North Star", "2EASY"];
export const DIVISION_LABEL: Record<Division, string> = {
  ECS: "ECS Network / Vantage",
  Tortuga: "Tortuga Productions",
  "Easy Supply": "Easy Supply Co.",
  "North Star": "North Star Network",
  "2EASY": "2EASY (music)",
};

const MILESTONE_DIVISION: Record<Milestone["division"], Division> = {
  "Tortuga Productions": "Tortuga",
  "Easy Supply Co.": "Easy Supply",
  "North Star Network": "North Star",
  "2EASY": "2EASY",
  "ECS Network": "ECS",
};

/** "mine": E owes it. "theirs": E is waiting on someone. */
export type Direction = "mine" | "theirs";

export interface Commitment {
  id: string;
  text: string;
  division: Division;
  direction: Direction;
  /** Who it's for (mine) or who owes it (theirs). */
  who?: string;
  /** YYYY-MM-DD */
  due?: string;
  createdAt: string;
  doneAt?: string;
  /** Last time E nudged them (theirs). */
  nudgedAt?: string;
  fromAgent?: boolean;
}

export interface Decision {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  division: Division;
  title: string;
  why?: string;
  /** YYYY-MM-DD to look at it again. */
  revisit?: string;
}

export type Rag = "green" | "yellow" | "red";

export interface WeekRitual {
  /** Monday kickoff: the week's top 3. */
  priorities: string[];
  kickoffAt?: string;
  /** Friday close. */
  win?: string;
  learn?: string;
  nextFocus?: string;
  closeAt?: string;
  /** E's call on each division this week (overrides the auto status). */
  pulse: Partial<Record<Division, { status: Rag; note?: string }>>;
}

export interface CosState {
  commitments: Commitment[];
  decisions: Decision[];
  /** Monday (YYYY-MM-DD) → that week. */
  weeks: Record<string, WeekRitual>;
  /** Inbox item ids E already handled (accepted or dismissed). */
  inboxHandled: string[];
  updatedAt: string;
}

export const EMPTY_COS: CosState = {
  commitments: [],
  decisions: [],
  weeks: {},
  inboxHandled: [],
  updatedAt: new Date(0).toISOString(),
};

export const EMPTY_WEEK: WeekRitual = { priorities: [], pulse: {} };

/** Posted by the CoS agent (server-owned; the app never overwrites it). */
export interface CosInboxItem {
  id: string;
  at: string;
  kind: "memo" | "suggestion";
  title: string;
  body: string;
  division?: Division;
  /** For suggestions: a commitment E can accept with one tap. */
  commitment?: { text: string; direction: Direction; who?: string; due?: string };
}

export function normalizeCos(c: Partial<CosState> | null | undefined): CosState {
  return {
    ...EMPTY_COS,
    ...(c ?? {}),
    commitments: c?.commitments ?? [],
    decisions: c?.decisions ?? [],
    weeks: c?.weeks ?? {},
    inboxHandled: c?.inboxHandled ?? [],
  };
}

export function isDivision(x: unknown): x is Division {
  return typeof x === "string" && (DIVISIONS as string[]).includes(x);
}

// ── Weeks ────────────────────────────────────────────────────────────────

/** Monday of the week containing `day`. */
export function mondayOf(day: string): string {
  const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return addDays(day, -offset[weekdayOfDay(day)]);
}

export function weekOf(cos: CosState, day: string): WeekRitual {
  return { ...EMPTY_WEEK, ...(cos.weeks[mondayOf(day)] ?? {}) };
}

/**
 * Which ritual is due: the close from Friday on (even if the kickoff was
 * skipped), otherwise the kickoff until it's done (it's meant for Monday).
 */
export function ritualDue(cos: CosState, today: string): "kickoff" | "close" | null {
  const w = weekOf(cos, today);
  const wd = weekdayOfDay(today);
  if (wd === "Fri" || wd === "Sat" || wd === "Sun") return w.closeAt ? null : "close";
  return w.kickoffAt ? null : "kickoff";
}

// ── Commitments ──────────────────────────────────────────────────────────

export interface CommitmentBuckets {
  overdue: Commitment[];
  thisWeek: Commitment[];
  later: Commitment[];
  someday: Commitment[];
}

/** Open commitments by urgency (soonest first). Sunday ends the week. */
export function bucketCommitments(list: Commitment[], today: string): CommitmentBuckets {
  const weekEnd = addDays(mondayOf(today), 6);
  const open = list.filter((c) => !c.doneAt).sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  return {
    overdue: open.filter((c) => c.due && c.due < today),
    thisWeek: open.filter((c) => c.due && c.due >= today && c.due <= weekEnd),
    later: open.filter((c) => c.due && c.due > weekEnd),
    someday: open.filter((c) => !c.due),
  };
}

/** "Waiting on" items worth a nudge: overdue, or 5+ days since asked/nudged. */
export function needsNudge(c: Commitment, today: string): boolean {
  if (c.doneAt || c.direction !== "theirs") return false;
  if (c.due && c.due < today) return true;
  const last = (c.nudgedAt ?? c.createdAt).slice(0, 10);
  return addDays(last, 5) <= today;
}

export function decisionsToRevisit(cos: CosState, today: string): Decision[] {
  return cos.decisions.filter((d) => d.revisit && d.revisit <= today).sort((a, b) => a.revisit!.localeCompare(b.revisit!));
}

// ── Division scorecard ───────────────────────────────────────────────────

export interface DivisionCard {
  division: Division;
  label: string;
  status: Rag;
  /** True when E set the status this week. */
  manual: boolean;
  note?: string;
  why: string[];
  openTasks: number;
  overdueTasks: number;
  doneThisMonth: number;
  revenueThisMonth: number;
  mineOpen: number;
  theirsOpen: number;
  overdueCommitments: number;
  activeMilestones: string[];
  /** The next open plan task, as "what to move". */
  nextMove?: string;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function scorecard(
  cos: CosState,
  plan: PlanState,
  hub: Pick<HubState, "money"> | null,
  today: string,
  milestones: Milestone[] = MILESTONES,
): DivisionCard[] {
  const month = monthKey(today);
  const tasks = allTasks(plan);
  const week = weekOf(cos, today);
  const money = hub?.money ?? [];

  return DIVISIONS.map((division) => {
    const mine = tasks.filter((t) => t.area === division);
    const open = mine.filter((t) => !isDone(plan, t) && t.month <= month).sort((a, b) => a.month.localeCompare(b.month));
    const overdueTasks = open.filter((t) => t.month < month).length;
    const doneThisMonth = mine.filter((t) => (plan.done[t.id] ?? "").startsWith(month)).length;
    const revenueThisMonth = moneyMonth(
      money.filter((e) => e.kind === "in" && e.category === division),
      month,
    ).income;
    const commits = cos.commitments.filter((c) => c.division === division && !c.doneAt);
    const overdueCommitments = commits.filter((c) => c.due && c.due < today).length;
    const active = milestones.filter(
      (m) => MILESTONE_DIVISION[m.division] === division && m.start <= today && (m.end ?? m.start) >= today,
    );
    // A milestone ending within 7 days with open tasks this month is at risk.
    const endingSoon = active.filter((m) => {
      const left = daysBetween(today, m.end ?? m.start);
      return left >= 0 && left <= 7;
    });

    const why: string[] = [];
    if (overdueTasks) why.push(`${overdueTasks} plan task${overdueTasks === 1 ? "" : "s"} overdue`);
    if (overdueCommitments) why.push(`${overdueCommitments} commitment${overdueCommitments === 1 ? "" : "s"} past due`);
    if (endingSoon.length && open.length) why.push(`${endingSoon.map((m) => m.title).join(", ")} ends within a week`);

    let status: Rag = "green";
    if (overdueTasks >= 3 || overdueCommitments >= 2 || (endingSoon.length && open.length >= 3)) status = "red";
    else if (why.length) status = "yellow";

    const pulse = week.pulse[division];
    return {
      division,
      label: DIVISION_LABEL[division],
      status: pulse?.status ?? status,
      manual: Boolean(pulse),
      note: pulse?.note,
      why,
      openTasks: open.length,
      overdueTasks,
      doneThisMonth,
      revenueThisMonth,
      mineOpen: commits.filter((c) => c.direction === "mine").length,
      theirsOpen: commits.filter((c) => c.direction === "theirs").length,
      overdueCommitments,
      activeMilestones: active.map((m) => m.title),
      nextMove: open[0]?.title,
    };
  });
}

// ── Headlines (Vantage briefing, spoken brief, Do today) ─────────────────

export function cosHeadlines(cos: CosState, plan: PlanState, hub: Pick<HubState, "money"> | null, today: string): string[] {
  const out: string[] = [];
  const b = bucketCommitments(cos.commitments, today);
  const due = ritualDue(cos, today);
  if (due === "kickoff") out.push("Chief of Staff: set this week's top 3 (Monday kickoff).");
  if (due === "close") out.push("Chief of Staff: close the week (one win, one lesson).");
  const mineOverdue = b.overdue.filter((c) => c.direction === "mine");
  if (mineOverdue.length) out.push(`You owe ${mineOverdue.length} overdue: ${mineOverdue.slice(0, 2).map((c) => c.text).join("; ")}.`);
  const mineToday = b.thisWeek.filter((c) => c.direction === "mine" && c.due === today);
  if (mineToday.length) out.push(`Due today: ${mineToday.map((c) => c.text).join("; ")}.`);
  const nudges = cos.commitments.filter((c) => needsNudge(c, today));
  if (nudges.length) out.push(`${nudges.length} follow-up${nudges.length === 1 ? "" : "s"} to send (waiting on ${[...new Set(nudges.map((c) => c.who).filter(Boolean))].slice(0, 3).join(", ") || "people"}).`);
  const red = scorecard(cos, plan, hub, today).filter((c) => c.status === "red");
  if (red.length) out.push(`Red: ${red.map((c) => c.label).join(", ")}.`);
  const revisit = decisionsToRevisit(cos, today);
  if (revisit.length) out.push(`Revisit decision: ${revisit[0].title}.`);
  const pri = weekOf(cos, today).priorities.filter(Boolean);
  if (pri.length && due !== "kickoff") out.push(`This week's top 3: ${pri.join("; ")}.`);
  return out;
}

// ── Snapshot (export for the agent, prompts, /api/cos) ───────────────────

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function commitLine(c: Commitment, today: string): string {
  const who = c.who ? (c.direction === "mine" ? ` → for ${c.who}` : ` ← from ${c.who}`) : "";
  const due = c.due ? ` (due ${c.due}${c.due < today ? ", OVERDUE" : ""})` : "";
  const nudge = needsNudge(c, today) ? " [nudge]" : "";
  return `- [${c.division}] ${c.text}${who}${due}${nudge}`;
}

/**
 * Plain-text state of ECS for the agent and for prompts. Contains no contact
 * details; names are whatever E typed as "who".
 */
export function renderCosMarkdown(
  cos: CosState,
  plan: PlanState,
  hub: Pick<HubState, "money" | "revenueGoal"> | null,
  today: string,
): string {
  const week = weekOf(cos, today);
  const b = bucketCommitments(cos.commitments, today);
  const cards = scorecard(cos, plan, hub, today);
  const month = monthKey(today);
  const ecsRevenue = hub ? moneyMonth(hub.money, month).ecsRevenue : 0;
  const lines: string[] = [
    `# ECS Chief of Staff snapshot (${today}, ${weekdayOfDay(today)})`,
    "",
    `Week of ${mondayOf(today)}. Revenue this month: ${money(ecsRevenue)}${hub ? ` of a ${money(hub.revenueGoal)} goal (ladder to $100K/month)` : ""}.`,
    "",
    "## This week's top 3",
    ...(week.priorities.filter(Boolean).length ? week.priorities.filter(Boolean).map((p, i) => `${i + 1}. ${p}`) : ["- Not set yet (kickoff pending)"]),
  ];
  if (week.closeAt) {
    lines.push("", "## Week close", `- Win: ${week.win || "-"}`, `- Learn: ${week.learn || "-"}`, `- Next focus: ${week.nextFocus || "-"}`);
  }
  lines.push("", "## Division scorecard");
  for (const c of cards) {
    lines.push(
      `### ${c.label}: ${c.status.toUpperCase()}${c.manual ? " (E's call)" : ""}${c.note ? ` - ${c.note}` : ""}`,
      `- Plan: ${c.openTasks} open through this month (${c.overdueTasks} overdue), ${c.doneThisMonth} done this month`,
      `- Revenue this month: ${money(c.revenueThisMonth)}`,
      `- Commitments: E owes ${c.mineOpen}, waiting on ${c.theirsOpen}${c.overdueCommitments ? `, ${c.overdueCommitments} past due` : ""}`,
    );
    if (c.activeMilestones.length) lines.push(`- Roadmap now: ${c.activeMilestones.join("; ")}`);
    if (c.nextMove) lines.push(`- Next plan move: ${c.nextMove}`);
    if (c.why.length) lines.push(`- Flags: ${c.why.join("; ")}`);
  }
  const section = (title: string, list: Commitment[]) => {
    lines.push("", `## ${title}`);
    lines.push(...(list.length ? list.map((c) => commitLine(c, today)) : ["- None"]));
  };
  section("Overdue commitments", b.overdue);
  section("Due this week", b.thisWeek);
  section("Later", b.later);
  section("No date", b.someday);

  const recent = [...cos.decisions].sort((a, b2) => b2.date.localeCompare(a.date)).slice(0, 10);
  lines.push("", "## Recent decisions");
  lines.push(
    ...(recent.length
      ? recent.map((d) => `- ${d.date} [${d.division}] ${d.title}${d.why ? ` (why: ${d.why})` : ""}${d.revisit ? ` (revisit ${d.revisit})` : ""}`)
      : ["- None logged"]),
  );
  const upcoming = MILESTONES.filter((m) => m.start > today && daysBetween(today, m.start) <= 30);
  if (upcoming.length) {
    lines.push("", "## Roadmap: starting in the next 30 days");
    lines.push(...upcoming.map((m) => `- ${m.start}: ${m.title} (${m.division})`));
  }
  return lines.join("\n") + "\n";
}

// ── Prompts (Copy / Open in Claude) ──────────────────────────────────────

const ABOUT =
  "You are my chief of staff for ECS Network (I'm E, founder; Vallejo, CA). ECS runs four divisions under Vantage: " +
  "Tortuga Productions (film/media; 2027 flagship is the $BAY doc series), Easy Supply Co. (merch), North Star Network " +
  "(nonprofit afterschool program) and 2EASY (my music). Near-term target: $100K/month across ECS. I also work days as an " +
  "SEL counselor, so ECS time is evenings and weekends.";

const RULES =
  "Plain language, short sections, no filler. Only use facts in the snapshot; mark guesses as [check]. " +
  "Never invent commitments, people or numbers.";

export function promptKickoff(snapshot: string): string {
  return [
    ABOUT,
    "",
    "It's my Monday kickoff. From the snapshot below, give me:",
    "1. The 3 priorities for this week that most move ECS (one line each, each a finished outcome, not an activity).",
    "2. What I owe people this week, in the order to do it.",
    "3. Who I'm waiting on and a one-line nudge for each.",
    "4. One thing to drop or delay, and why.",
    "",
    RULES,
    "",
    snapshot,
  ].join("\n");
}

export function promptClose(snapshot: string): string {
  return [
    ABOUT,
    "",
    "It's my Friday close (motto: win or learn). From the snapshot below, write a one-page weekly memo:",
    "- What moved (by division), what slipped and why",
    "- The one win to celebrate and the one lesson",
    "- Red/yellow divisions: the single move that turns each green",
    "- Next week's draft top 3",
    "",
    RULES,
    "",
    snapshot,
  ].join("\n");
}

export function promptFollowUp(c: Commitment, today: string): string {
  return [
    ABOUT,
    "",
    `Draft a short, warm follow-up message to ${c.who || "the person"} about: "${c.text}" (${DIVISION_LABEL[c.division]}).`,
    c.due ? `It was due ${c.due}${c.due < today ? " and is now late" : ""}.` : "There was no firm date.",
    "Give me a text-message version (2 sentences) and an email version (subject + 4 sentences max). " +
      "Friendly, direct, make the next step easy to say yes to. No guilt-tripping.",
  ].join("\n");
}

export function promptDecision(d: Pick<Decision, "title" | "division" | "why">, snapshot: string): string {
  return [
    ABOUT,
    "",
    `Pressure-test a decision for ${DIVISION_LABEL[d.division]}: "${d.title}".`,
    d.why ? `My reasoning: ${d.why}` : "",
    "Give me: the strongest case against it, what would have to be true for it to be right, the cheapest way to test it, " +
      "and a date I should revisit it.",
    "",
    RULES,
    "",
    snapshot,
  ].filter(Boolean).join("\n");
}
