import { useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  ClipboardCopy,
  Gavel,
  Inbox,
  ListChecks,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  DIVISIONS,
  DIVISION_LABEL,
  EMPTY_WEEK,
  bucketCommitments,
  cosHeadlines,
  decisionsToRevisit,
  mondayOf,
  needsNudge,
  promptClose,
  promptDecision,
  promptFollowUp,
  promptKickoff,
  renderCosMarkdown,
  ritualDue,
  scorecard,
  weekOf,
  type Commitment,
  type CosInboxItem,
  type CosState,
  type Direction,
  type Division,
  type Rag,
  type WeekRitual,
} from "../../shared/chiefOfStaff";
import type { PlanState } from "../../shared/plan";
import type { HubState } from "../../shared/hub";
import { PromptButton } from "./PromptButton";

type Tab = "brief" | "owe" | "score" | "decide";
const TAB_LABEL: Record<Tab, string> = { brief: "Brief", owe: "Commitments", score: "Scorecard", decide: "Decisions" };

interface Props {
  cos: CosState;
  update: (fn: (c: CosState) => CosState) => void;
  inbox: CosInboxItem[];
  onRefreshInbox: () => void;
  plan: PlanState;
  hub: HubState;
  today: string;
  initialTab?: Tab;
}

const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const RAG_STYLE: Record<Rag, string> = {
  green: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  yellow: "bg-amber-300/15 text-amber-200 border-amber-300/40",
  red: "bg-rose-500/15 text-rose-300 border-rose-400/40",
};
const shortDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/** ECS Chief of Staff: weekly rhythm, commitments, division scorecard, decisions, agent inbox. */
export function ChiefOfStaffPanel(props: Props) {
  const due = ritualDue(props.cos, props.today);
  const [tab, setTab] = useState<Tab>(props.initialTab ?? "brief");
  const snapshot = () => renderCosMarkdown(props.cos, props.plan, props.hub, props.today);
  const [copied, setCopied] = useState(false);

  return (
    <section id="chief-of-staff" className="panel-hud p-5" aria-label="ECS Chief of Staff">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="hud-label flex items-center gap-1.5 !text-sm">
          <Briefcase className="h-4 w-4" /> ECS Chief of Staff
        </h2>
        <div className="flex items-center gap-2">
          {props.inbox.length > 0 && (
            <span className="rounded-full border border-alfred-gold/40 px-2 py-0.5 font-mono text-[11px] text-alfred-gold">
              {props.inbox.length} from agent
            </span>
          )}
          <button
            type="button"
            className="btn-ghost !px-2 !py-1 text-xs"
            title="Copy the ECS snapshot (for Claude or the agent)"
            onClick={() => {
              void navigator.clipboard?.writeText(snapshot()).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
            <span className="font-mono uppercase">{copied ? "Copied" : "Snapshot"}</span>
          </button>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-full border border-alfred-border/60 p-1" role="tablist">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`rounded-full py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider ${tab === t ? "bg-alfred-gold/20 text-alfred-gold" : "text-alfred-mist"}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABEL[t]}
            {t === "brief" && due ? " •" : ""}
          </button>
        ))}
      </div>
      {tab === "brief" && <BriefTab {...props} snapshot={snapshot} />}
      {tab === "owe" && <CommitmentsTab {...props} />}
      {tab === "score" && <ScoreTab {...props} />}
      {tab === "decide" && <DecisionsTab {...props} snapshot={snapshot} />}
    </section>
  );
}

// ── Brief: headlines, ritual, agent inbox ────────────────────────────────

function patchWeek(update: Props["update"], today: string, fn: (w: WeekRitual) => WeekRitual) {
  const key = mondayOf(today);
  update((c) => ({ ...c, weeks: { ...c.weeks, [key]: fn({ ...EMPTY_WEEK, ...(c.weeks[key] ?? {}) }) } }));
}

function BriefTab(props: Props & { snapshot: () => string }) {
  const { cos, update, today, plan, hub, inbox } = props;
  const headlines = useMemo(() => cosHeadlines(cos, plan, hub, today), [cos, plan, hub, today]);
  const due = ritualDue(cos, today);
  const week = weekOf(cos, today);

  return (
    <div className="space-y-4">
      {headlines.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-alfred-cream">
          {headlines.map((h) => (
            <li key={h} className="flex gap-2">
              <span className="text-alfred-gold">›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-alfred-mist">All clear: nothing overdue, rhythm on track.</p>
      )}

      {due === "close" || week.closeAt ? <CloseCard {...props} week={week} /> : <KickoffCard {...props} week={week} />}

      <div className="border-t border-alfred-border/40 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="hud-label flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> From your agent
          </p>
          <button type="button" className="btn-ghost !px-2 !py-1" onClick={props.onRefreshInbox} aria-label="Check for new memos">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {inbox.length === 0 ? (
          <p className="text-xs text-alfred-mist">
            No new memos. The agent posts the Monday kickoff memo, Friday close memo and follow-up suggestions here.
          </p>
        ) : (
          <ul className="space-y-2">
            {inbox.map((i) => (
              <InboxRow key={i.id} item={i} update={update} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function handle(update: Props["update"], id: string, fn?: (c: CosState) => CosState) {
  update((c) => {
    const next = fn ? fn(c) : c;
    return { ...next, inboxHandled: [...next.inboxHandled, id].slice(-200) };
  });
}

function InboxRow({ item, update }: { item: CosInboxItem; update: Props["update"] }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="hud-tile">
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="text-left text-sm text-alfred-cream" onClick={() => setOpen(!open)}>
          <span className="font-mono text-[10px] uppercase text-alfred-gold mr-1.5">{item.kind}</span>
          {item.title}
          <span className="block text-[11px] text-alfred-mist">{new Date(item.at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}{item.division ? ` · ${item.division}` : ""}</span>
        </button>
        <div className="flex shrink-0 gap-1">
          {item.commitment && (
            <button
              type="button"
              className="btn-ghost !px-2 !py-1 text-emerald-300"
              aria-label="Add as a commitment"
              title="Add as a commitment"
              onClick={() =>
                handle(update, item.id, (c) => ({
                  ...c,
                  commitments: [
                    {
                      id: newId("c"),
                      text: item.commitment!.text,
                      direction: item.commitment!.direction,
                      who: item.commitment!.who,
                      due: item.commitment!.due,
                      division: item.division ?? "ECS",
                      createdAt: new Date().toISOString(),
                      fromAgent: true,
                    },
                    ...c.commitments,
                  ],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" className="btn-ghost !px-2 !py-1" aria-label="Dismiss" title="Done with this" onClick={() => handle(update, item.id)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {open && item.body && <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-alfred-cream/90">{item.body}</pre>}
    </li>
  );
}

function KickoffCard({ update, today, week, snapshot }: Props & { week: WeekRitual; snapshot: () => string }) {
  const [draft, setDraft] = useState<string[]>(() => [0, 1, 2].map((i) => week.priorities[i] ?? ""));
  const done = Boolean(week.kickoffAt);
  return (
    <div className="hud-tile space-y-2">
      <div className="flex items-center justify-between">
        <p className="hud-label !tracking-[0.15em]">Kickoff · {shortDate(mondayOf(today))}</p>
        <PromptButton label="Plan it" build={() => promptKickoff(snapshot())} />
      </div>
      <p className="text-xs text-alfred-mist">Three outcomes that move ECS this week. Finished things, not activities.</p>
      {draft.map((p, i) => (
        <input
          key={i}
          className="input-field"
          placeholder={["e.g. $BAY budget table locked", "e.g. Fiscal sponsor inquiry sent to 3 orgs", "e.g. Sponsor deck v1 done"][i]}
          value={p}
          onChange={(e) => setDraft(draft.map((d, j) => (j === i ? e.target.value : d)))}
          aria-label={`Priority ${i + 1}`}
        />
      ))}
      <button
        type="button"
        className="btn-gold w-full"
        onClick={() => patchWeek(update, today, (w) => ({ ...w, priorities: draft.map((d) => d.trim()), kickoffAt: w.kickoffAt ?? new Date().toISOString() }))}
      >
        <Check className="h-4 w-4" /> {done ? "Update top 3" : "Lock the week"}
      </button>
    </div>
  );
}

function CloseCard({ update, today, week, snapshot }: Props & { week: WeekRitual; snapshot: () => string }) {
  const [win, setWin] = useState(week.win ?? "");
  const [learn, setLearn] = useState(week.learn ?? "");
  const [next, setNext] = useState(week.nextFocus ?? "");
  const pri = week.priorities.filter(Boolean);
  return (
    <div className="hud-tile space-y-2">
      <div className="flex items-center justify-between">
        <p className="hud-label !tracking-[0.15em]">Close · win or learn</p>
        <PromptButton label="Memo" build={() => promptClose(snapshot())} />
      </div>
      {pri.length > 0 && (
        <ol className="list-decimal pl-5 text-xs text-alfred-mist">
          {pri.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      )}
      <input className="input-field" placeholder="The win" value={win} onChange={(e) => setWin(e.target.value)} aria-label="This week's win" />
      <input className="input-field" placeholder="The lesson" value={learn} onChange={(e) => setLearn(e.target.value)} aria-label="This week's lesson" />
      <input className="input-field" placeholder="Next week's focus" value={next} onChange={(e) => setNext(e.target.value)} aria-label="Next week's focus" />
      <button
        type="button"
        className="btn-gold w-full"
        onClick={() =>
          patchWeek(update, today, (w) => ({ ...w, win: win.trim(), learn: learn.trim(), nextFocus: next.trim(), closeAt: w.closeAt ?? new Date().toISOString() }))
        }
      >
        <Check className="h-4 w-4" /> {week.closeAt ? "Update close" : "Close the week"}
      </button>
    </div>
  );
}

// ── Commitments ──────────────────────────────────────────────────────────

function CommitmentsTab({ cos, update, today }: Props) {
  const [text, setText] = useState("");
  const [who, setWho] = useState("");
  const [due, setDue] = useState("");
  const [division, setDivision] = useState<Division>("Tortuga");
  const [direction, setDirection] = useState<Direction>("mine");
  const [showDone, setShowDone] = useState(false);
  const b = bucketCommitments(cos.commitments, today);
  const done = cos.commitments.filter((c) => c.doneAt).sort((a, z) => z.doneAt!.localeCompare(a.doneAt!)).slice(0, 15);

  const patch = (id: string, fn: (c: Commitment) => Commitment | null) =>
    update((s) => ({
      ...s,
      commitments: s.commitments.map((c) => (c.id === id ? fn(c) : c)).filter((c): c is Commitment => c !== null),
    }));

  const groups: [string, Commitment[]][] = [
    ["Overdue", b.overdue],
    ["This week", b.thisWeek],
    ["Later", b.later],
    ["No date", b.someday],
  ];

  return (
    <div className="space-y-3">
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          update((s) => ({
            ...s,
            commitments: [
              { id: newId("c"), text: text.trim(), who: who.trim() || undefined, due: due || undefined, division, direction, createdAt: new Date().toISOString() },
              ...s.commitments,
            ].slice(0, 500),
          }));
          setText("");
          setWho("");
          setDue("");
        }}
      >
        <div className="grid grid-cols-2 rounded-md border border-alfred-border/60 p-0.5 text-[11px] font-mono uppercase">
          {(["mine", "theirs"] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded py-1 ${direction === d ? "bg-alfred-gold/20 text-alfred-gold" : "text-alfred-mist"}`}
              onClick={() => setDirection(d)}
            >
              {d === "mine" ? "I owe" : "Waiting on"}
            </button>
          ))}
        </div>
        <input className="input-field" placeholder={direction === "mine" ? "What I promised" : "What they owe me"} value={text} onChange={(e) => setText(e.target.value)} aria-label="Commitment" />
        <div className="grid grid-cols-3 gap-2">
          <input className="input-field" placeholder={direction === "mine" ? "For whom" : "Who"} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Person" />
          <input className="input-field" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
          <select className="input-field" value={division} onChange={(e) => setDivision(e.target.value as Division)} aria-label="Division">
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-gold">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      {groups.map(([label, list]) =>
        list.length ? (
          <div key={label}>
            <p className={`mb-1 font-mono text-[10px] uppercase tracking-wider ${label === "Overdue" ? "text-rose-300" : "text-alfred-mist"}`}>
              {label} · {list.length}
            </p>
            <ul className="space-y-1.5">
              {list.map((c) => (
                <li key={c.id} className="hud-tile flex items-start gap-2">
                  <button
                    type="button"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border border-alfred-gold/50"
                    aria-label={`Mark done: ${c.text}`}
                    onClick={() => patch(c.id, (x) => ({ ...x, doneAt: new Date().toISOString() }))}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-alfred-cream">{c.text}</p>
                    <p className="text-[11px] text-alfred-mist">
                      {c.direction === "mine" ? "I owe" : "Waiting on"}
                      {c.who ? ` ${c.direction === "mine" ? "→" : "←"} ${c.who}` : ""} · {c.division}
                      {c.due ? ` · ${shortDate(c.due)}` : ""}
                      {c.nudgedAt ? ` · nudged ${shortDate(c.nudgedAt.slice(0, 10))}` : ""}
                    </p>
                    {c.direction === "theirs" && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {needsNudge(c, today) && <span className="font-mono text-[10px] uppercase text-amber-200">Nudge</span>}
                        <PromptButton
                          label="Follow-up"
                          build={() => promptFollowUp(c, today)}
                          onUsed={() => patch(c.id, (x) => ({ ...x, nudgedAt: new Date().toISOString() }))}
                        />
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-alfred-border/60 px-2 py-0.5 text-[11px] font-mono uppercase text-alfred-mist"
                          onClick={() => patch(c.id, (x) => ({ ...x, nudgedAt: new Date().toISOString() }))}
                        >
                          <Send className="h-3 w-3" /> Nudged
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="button" className="btn-ghost !p-1" aria-label={`Delete: ${c.text}`} onClick={() => patch(c.id, () => null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {!cos.commitments.some((c) => !c.doneAt) && (
        <p className="text-xs text-alfred-mist">
          Nothing open. Log every promise you make ("I'll send the deck Friday") and every ask you're waiting on.
        </p>
      )}

      {done.length > 0 && (
        <div>
          <button type="button" className="text-[11px] font-mono uppercase text-alfred-mist underline" onClick={() => setShowDone(!showDone)}>
            {showDone ? "Hide" : "Show"} done ({done.length})
          </button>
          {showDone && (
            <ul className="mt-1 space-y-1">
              {done.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-xs text-alfred-mist">
                  <span className="line-through">{c.text}</span>
                  <button type="button" className="btn-ghost !p-1" aria-label={`Reopen: ${c.text}`} onClick={() => patch(c.id, (x) => ({ ...x, doneAt: undefined }))}>
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Scorecard ────────────────────────────────────────────────────────────

function ScoreTab({ cos, update, plan, hub, today }: Props) {
  const cards = useMemo(() => scorecard(cos, plan, hub, today), [cos, plan, hub, today]);
  const setPulse = (d: Division, status: Rag | null, note?: string) =>
    patchWeek(update, today, (w) => {
      const pulse = { ...w.pulse };
      if (status) pulse[d] = { status, note: note ?? pulse[d]?.note };
      else delete pulse[d];
      return { ...w, pulse };
    });

  return (
    <div className="space-y-2">
      <p className="text-xs text-alfred-mist">Auto status from plan tasks, roadmap and commitments. Tap a color to make the call yourself this week.</p>
      {cards.map((c) => (
        <div key={c.division} className="hud-tile space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-alfred-cream">{c.label}</p>
            <div className="flex gap-1">
              {(["green", "yellow", "red"] as Rag[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-label={`${c.label}: ${r}`}
                  aria-pressed={c.status === r}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${c.status === r ? RAG_STYLE[r] : "border-alfred-border/50 text-alfred-mist/60"}`}
                  onClick={() => (c.manual && c.status === r ? setPulse(c.division, null) : setPulse(c.division, r))}
                >
                  {r[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              ["Open", c.openTasks, c.overdueTasks ? `${c.overdueTasks} late` : ""],
              ["Done/mo", c.doneThisMonth, ""],
              ["Revenue", money(c.revenueThisMonth), ""],
              ["Owe/wait", `${c.mineOpen}/${c.theirsOpen}`, c.overdueCommitments ? `${c.overdueCommitments} late` : ""],
            ].map(([label, value, sub]) => (
              <div key={String(label)}>
                <p className="font-mono text-[9px] uppercase text-alfred-mist">{label}</p>
                <p className="font-mono text-sm text-alfred-cream">{value}</p>
                {sub && <p className="font-mono text-[9px] text-rose-300">{sub}</p>}
              </div>
            ))}
          </div>
          {c.activeMilestones.length > 0 && <p className="text-[11px] text-alfred-mist">Now: {c.activeMilestones.join("; ")}</p>}
          {c.why.length > 0 && !c.manual && <p className="text-[11px] text-amber-200">{c.why.join(" · ")}</p>}
          {c.nextMove && <p className="text-[11px] text-alfred-cream/80">Next move: {c.nextMove}</p>}
          {c.manual && (
            <input
              className="input-field !py-1 text-xs"
              placeholder="One line on why (optional)"
              defaultValue={c.note ?? ""}
              onBlur={(e) => setPulse(c.division, c.status, e.target.value.trim() || undefined)}
              aria-label={`${c.label} note`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Decisions ────────────────────────────────────────────────────────────

function DecisionsTab({ cos, update, today, snapshot }: Props & { snapshot: () => string }) {
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [revisit, setRevisit] = useState("");
  const [division, setDivision] = useState<Division>("ECS");
  const due = decisionsToRevisit(cos, today);
  const list = [...cos.decisions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3">
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          update((s) => ({
            ...s,
            decisions: [...s.decisions, { id: newId("d"), date: today, division, title: title.trim(), why: why.trim() || undefined, revisit: revisit || undefined }].slice(-300),
          }));
          setTitle("");
          setWhy("");
          setRevisit("");
        }}
      >
        <input className="input-field" placeholder="What we decided" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Decision" />
        <input className="input-field" placeholder="Why (one line)" value={why} onChange={(e) => setWhy(e.target.value)} aria-label="Why" />
        <div className="grid grid-cols-2 gap-2">
          <select className="input-field" value={division} onChange={(e) => setDivision(e.target.value as Division)} aria-label="Division">
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {DIVISION_LABEL[d]}
              </option>
            ))}
          </select>
          <input className="input-field" type="date" value={revisit} onChange={(e) => setRevisit(e.target.value)} aria-label="Revisit on" title="Revisit on" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-gold flex-1">
            <Gavel className="h-4 w-4" /> Log decision
          </button>
          {title.trim() && <PromptButton label="Test it" build={() => promptDecision({ title, why, division }, snapshot())} />}
        </div>
      </form>

      {due.length > 0 && (
        <p className="text-xs text-amber-200">
          <ListChecks className="mr-1 inline h-3.5 w-3.5" />
          Time to revisit: {due.map((d) => d.title).join("; ")}
        </p>
      )}
      <ul className="space-y-1.5">
        {list.map((d) => (
          <li key={d.id} className="hud-tile flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-alfred-cream">{d.title}</p>
              <p className="text-[11px] text-alfred-mist">
                {shortDate(d.date)} · {d.division}
                {d.why ? ` · ${d.why}` : ""}
                {d.revisit ? ` · revisit ${shortDate(d.revisit)}` : ""}
              </p>
            </div>
            {d.revisit && d.revisit <= today && (
              <button
                type="button"
                className="btn-ghost !px-2 !py-1 text-[11px]"
                title="Still right: clear the revisit date"
                onClick={() => update((s) => ({ ...s, decisions: s.decisions.map((x) => (x.id === d.id ? { ...x, revisit: undefined } : x)) }))}
              >
                <Check className="h-3.5 w-3.5" /> Holds
              </button>
            )}
            <button
              type="button"
              className="btn-ghost !p-1"
              aria-label={`Delete decision: ${d.title}`}
              onClick={() => update((s) => ({ ...s, decisions: s.decisions.filter((x) => x.id !== d.id) }))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {!list.length && <p className="text-xs text-alfred-mist">Log the calls you make so future you (and the agent) knows why.</p>}
    </div>
  );
}
