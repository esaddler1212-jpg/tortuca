import { useMemo, useState, type ReactElement } from "react";
import { Check, Flag, Pencil, Plus, Target, Trash2, X } from "lucide-react";
import type { CalendarEvent } from "../types";
import type { Area, PlanTask, YearGoal } from "../../shared/planData";
import {
  allGoals,
  daysLeftInYear,
  goalProgress,
  isDone,
  monthKey,
  monthTasks,
  nudges,
  sparkHistory,
  weekFocus,
  type PlanState,
} from "../../shared/plan";
import { AI_TAG_LABEL, promptForEvent, promptForTask } from "../lib/promptGenerator";
import { upcomingEvents } from "../lib/spokenBrief";
import { PromptButton } from "./PromptButton";

type Tab = "week" | "month" | "year";

const AREAS: Area[] = ["Tortuga", "North Star", "Easy Supply", "2EASY", "ECS", "Personal"];

interface Props {
  plan: PlanState;
  today: string;
  mode: string;
  timeZone: string;
  now: Date;
  events: CalendarEvent[];
  /** Plan task ids already on Do today (not repeated here). */
  onTodayIds: Set<string>;
  onToggleTask: (id: string) => void;
  onAddTask: (t: PlanTask) => void;
  onRemoveTask: (id: string) => void;
  onSetGoals: (g: YearGoal[]) => void;
  /** Start on this tab (e.g. "year" in the Vantage view). */
  initialTab?: Tab;
}

function Bar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="hud-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

interface TaskRowProps {
  t: PlanTask;
  plan: PlanState;
  month: string;
  goal?: YearGoal;
  onToggle: (id: string) => void;
}

/** One plan task: check off, AI tag, and its prompt. Top-level so open prompts survive re-renders. */
function TaskRow({ t, plan, month, goal, onToggle }: TaskRowProps) {
  const done = isDone(plan, t);
  return (
    <li className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${done ? "border-alfred-border/30 opacity-60" : "border-alfred-border/60"}`}>
      <button
        type="button"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${done ? "border-alfred-gold/60 bg-alfred-gold/20 text-alfred-gold" : "border-alfred-border hover:border-alfred-gold"}`}
        onClick={() => onToggle(t.id)}
        aria-label={done ? `Undo: ${t.title}` : `Done: ${t.title}`}
        disabled={t.doneAtStart}
      >
        {done && <Check className="h-4 w-4" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={done ? "line-through" : ""}>{t.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-alfred-mist">
          <span>{t.area}</span>
          {t.month < month && !done && <span className="text-amber-300">overdue · {monthName(t.month)}</span>}
          <span title={AI_TAG_LABEL[t.ai].long}>{AI_TAG_LABEL[t.ai].short}</span>
          {!done && <PromptButton build={() => promptForTask(t, goal)} />}
        </div>
      </div>
    </li>
  );
}

function monthName(month: string): string {
  return new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function PlanPanel(props: Props) {
  const { plan, today, mode, timeZone, now } = props;
  const [tab, setTab] = useState<Tab>(props.initialTab ?? "week");
  const goals = allGoals(plan);
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const year = Number(today.slice(0, 4));
  const month = monthKey(today);
  const days = daysLeftInYear(today);
  const yearNudges = nudges(plan, today);
  const renderTask = (t: PlanTask) => (
    <TaskRow key={t.id} t={t} plan={plan} month={month} goal={goalById.get(t.goalId)} onToggle={props.onToggleTask} />
  );

  return (
    <section className="panel-hud p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="hud-label flex items-center gap-1.5 !text-sm">
          <Target className="h-4 w-4" /> Plan
        </h2>
        <span className="font-mono text-xs text-alfred-mist">
          {days} day{days === 1 ? "" : "s"} left in {year}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-full border border-alfred-border/60 p-1" role="tablist">
        {(["week", "month", "year"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`rounded-full py-1.5 text-xs font-mono uppercase tracking-wider ${tab === t ? "bg-alfred-gold/20 text-alfred-gold" : "text-alfred-mist"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "week" && <WeekTab {...props} renderTask={renderTask} />}
      {tab === "month" && (
        <MonthTab plan={plan} month={month} renderTask={renderTask} goalById={goalById} onAddTask={props.onAddTask} goals={goals.filter((g) => g.year >= year)} />
      )}
      {tab === "year" && (
        <YearTab
          plan={plan}
          today={today}
          year={year}
          goals={goals}
          nudges={yearNudges}
          onSetGoals={props.onSetGoals}
          timeZone={timeZone}
          now={now}
          mode={mode}
        />
      )}
    </section>
  );
}

function WeekTab(props: Props & { renderTask: (t: PlanTask) => ReactElement }) {
  const { plan, today, mode, timeZone, now, renderTask } = props;
  const focus = weekFocus(plan, today, mode === "school" ? "network" : mode, 7).filter((t) => !props.onTodayIds.has(t.id)).slice(0, 5);
  const events = upcomingEvents(props.events, now, 7).slice(0, 4);
  return (
    <div className="space-y-5">
      <div>
        <p className="hud-label mb-2">Also this week</p>
        <ul className="space-y-2">
          {focus.map(renderTask)}
          {!focus.length && <li className="text-sm text-alfred-mist">Nothing else due. You're ahead.</li>}
        </ul>
      </div>

      {events.length > 0 && (
        <div>
          <p className="hud-label mb-2">Coming up</p>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={`${e.source}-${e.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-alfred-border/60 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-xs text-alfred-gold mr-2">
                    {new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(e.start))}
                  </span>
                  {e.title}
                </span>
                <PromptButton label="Prep" build={() => promptForEvent(e, timeZone)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MonthTab({
  plan,
  month,
  renderTask,
  goalById,
  goals,
  onAddTask,
}: {
  plan: PlanState;
  month: string;
  renderTask: (t: PlanTask) => ReactElement;
  goalById: Map<string, YearGoal>;
  goals: YearGoal[];
  onAddTask: (t: PlanTask) => void;
}) {
  const tasks = monthTasks(plan, month);
  const done = tasks.filter((t) => isDone(plan, t)).length;
  const byGoal = new Map<string, PlanTask[]>();
  for (const t of tasks) byGoal.set(t.goalId, [...(byGoal.get(t.goalId) ?? []), t]);
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <p className="hud-label">{monthName(month)}</p>
          <span className="font-mono text-xs text-alfred-mist">{done}/{tasks.length} done</span>
        </div>
        <Bar done={done} total={tasks.length} />
      </div>
      {[...byGoal.entries()].map(([gid, list]) => (
        <div key={gid}>
          <p className="text-xs text-alfred-gold mb-1.5 flex items-center gap-1">
            <Flag className="h-3 w-3" /> {goalById.get(gid)?.title ?? "Other"}
          </p>
          <ul className="space-y-2">{list.map(renderTask)}</ul>
        </div>
      ))}
      {!tasks.length && <p className="text-sm text-alfred-mist">No plan tasks this month.</p>}
      <form
        className="flex flex-col sm:flex-row gap-2 border-t border-alfred-border/40 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const g = goalById.get(goalId);
          if (!title.trim() || !g) return;
          onAddTask({
            id: `custom-${Date.now().toString(36)}`,
            title: title.trim(),
            area: g.area,
            goalId: g.id,
            month,
            section: "Added",
            ai: "assist",
          });
          setTitle("");
        }}
      >
        <input className="input-field flex-1" placeholder="Add a task this month…" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="New task" />
        <select className="input-field sm:w-56" value={goalId} onChange={(e) => setGoalId(e.target.value)} aria-label="Goal for the new task">
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.year} · {g.title}</option>
          ))}
        </select>
        <button type="submit" className="btn-gold" aria-label="Add task"><Plus className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

function YearTab({
  plan,
  today,
  year,
  goals,
  nudges: list,
  onSetGoals,
}: {
  plan: PlanState;
  today: string;
  year: number;
  goals: YearGoal[];
  nudges: ReturnType<typeof nudges>;
  onSetGoals: (g: YearGoal[]) => void;
  timeZone: string;
  now: Date;
  mode: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<YearGoal[]>(goals);
  const history = sparkHistory(plan, today, 8);
  const shown = (editing ? draft : goals).filter((g) => g.year === year || g.year === year + 1);

  const GoalList = ({ y }: { y: number }) => (
    <ul className="space-y-3">
      {shown
        .filter((g) => g.year === y)
        .map((g) => {
          const p = goalProgress(plan, g.id);
          const isSpark = /spark/i.test(g.id);
          return (
            <li key={g.id}>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    value={g.title}
                    onChange={(e) => setDraft(draft.map((d) => (d.id === g.id ? { ...d, title: e.target.value } : d)))}
                    aria-label="Goal title"
                  />
                  <select
                    className="input-field w-32"
                    value={g.area}
                    onChange={(e) => setDraft(draft.map((d) => (d.id === g.id ? { ...d, area: e.target.value as Area } : d)))}
                    aria-label="Area"
                  >
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <button type="button" className="btn-ghost p-2" onClick={() => setDraft(draft.filter((d) => d.id !== g.id))} aria-label="Remove goal">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm">{g.title}</p>
                    <span className="font-mono text-xs text-alfred-mist shrink-0">
                      {g.complete
                        ? "✓ Done"
                        : isSpark && y === year
                          ? `${history.reduce((n, w) => n + w.done, 0)}/${history.reduce((n, w) => n + w.possible, 0)} (8 wks)`
                          : p.total
                            ? `${p.done}/${p.total}`
                            : ""}
                    </span>
                  </div>
                  {g.detail && <p className="text-xs text-alfred-mist mb-1">{g.detail}</p>}
                  {isSpark && y === year ? (
                    <div className="flex items-end gap-1 h-8 mt-1" aria-label="Creative sparks, last 8 weeks">
                      {history.map((w) => (
                        <span
                          key={w.weekOf}
                          className="flex-1 rounded-sm bg-alfred-gold/70"
                          style={{ height: `${Math.max(8, (w.done / w.possible) * 100)}%`, opacity: w.done ? 1 : 0.25 }}
                          title={`Week of ${w.weekOf}: ${w.done}/${w.possible} sparks`}
                        />
                      ))}
                    </div>
                  ) : (
                    p.total > 0 && !g.complete && <Bar done={p.done} total={p.total} />
                  )}
                </>
              )}
            </li>
          );
        })}
    </ul>
  );

  return (
    <div className="space-y-5">
      {list.length > 0 && (
        <ul className="space-y-1.5">
          {list.slice(0, 3).map((n) => (
            <li key={n.goalId + n.text} className={`rounded-md border px-3 py-1.5 text-xs ${n.urgent ? "border-amber-400/50 text-amber-200" : "border-alfred-border/60 text-alfred-mist"}`}>
              {n.text}
            </li>
          ))}
        </ul>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="hud-label">{year} goals</p>
          {editing ? (
            <span className="flex gap-2">
              <button type="button" className="btn-ghost !py-1 text-xs" onClick={() => { setEditing(false); setDraft(goals); }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button type="button" className="btn-gold !py-1 text-xs" onClick={() => { onSetGoals(draft); setEditing(false); }}>
                <Check className="h-3.5 w-3.5" /> Save
              </button>
            </span>
          ) : (
            <button type="button" className="btn-ghost !py-1 text-xs" onClick={() => { setDraft(goals); setEditing(true); }}>
              <Pencil className="h-3.5 w-3.5" /> Edit goals
            </button>
          )}
        </div>
        <GoalList y={year} />
      </div>
      <div>
        <p className="hud-label mb-2">Next up: {year + 1}</p>
        <GoalList y={year + 1} />
        {editing && (
          <button
            type="button"
            className="btn-ghost mt-3 text-xs border border-alfred-gold/30"
            onClick={() => setDraft([...draft, { id: `goal-${Date.now().toString(36)}`, year: year + 1, area: "ECS", title: "New goal" }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add a {year + 1} goal
          </button>
        )}
      </div>
    </div>
  );
}

