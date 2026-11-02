import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarPlus,
  Check,
  Copy,
  ExternalLink,
  Eye,
  ListPlus,
  Mic,
  MicOff,
  NotebookPen,
  Pencil,
  Plus,
  RefreshCw,
  Rss,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  DEFAULT_FEEDS,
  DEFAULT_ROUTINE,
  EXPENSE_CATEGORIES,
  FEED_TOPICS,
  INCOME_CATEGORIES,
  REVENUE_LADDER,
  extractTodos,
  gymDayFor,
  isSafePublicUrl,
  moneyMonth,
  type FeedItem,
  type FeedTopic,
  type HubState,
  type MoneyCategory,
  type WatchResult,
} from "../../shared/hub";
import { authHeaders, ensureSession } from "../lib/google";
import { useSpeechInput } from "../hooks/useSpeechInput";
import { promptForMemo } from "../lib/promptGenerator";
import { PromptButton } from "./PromptButton";
import { GymTab } from "./GymTab";

type Tab = "feed" | "watch" | "gym" | "money" | "memos";
const TAB_LABEL: Record<Tab, string> = { feed: "Feed", watch: "Watch", gym: "Gym", money: "Money", memos: "Memos" };

interface Props {
  hub: HubState;
  update: (fn: (h: HubState) => HubState) => void;
  today: string;
  mode: string;
  timeZone: string;
  googleConnected: boolean;
  onAddTodo: (title: string) => void;
  onLogWorkout: (type: "arms" | "legs" | "body" | "cardio") => void;
  /** Workout already logged today (so finishing the routine doesn't log twice). */
  workoutLoggedToday: boolean;
  initialTab?: Tab;
}

const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pill = "rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider";

function timeAgo(iso: string | undefined, now = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const m = Math.max(0, Math.round((now - t) / 60_000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Feed, watchers, gym, money and memos in one place (one panel, five tabs). */
export function HubPanel(props: Props) {
  const gym = gymDayFor(props.hub.routine ?? DEFAULT_ROUTINE, props.today);
  const defaultTab: Tab =
    props.initialTab ?? (gym?.isToday ? "gym" : /weekend|vantage|holiday/.test(props.mode) ? "feed" : "memos");
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <section className="panel-hud p-5" aria-label="Hub">
      <div className="mb-4 grid grid-cols-5 gap-1 rounded-full border border-alfred-border/60 p-1" role="tablist">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`rounded-full py-1.5 text-[11px] font-mono uppercase tracking-wider ${tab === t ? "bg-alfred-gold/20 text-alfred-gold" : "text-alfred-mist"}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {tab === "feed" && <FeedTab {...props} />}
      {tab === "watch" && <WatchTab {...props} />}
      {tab === "gym" && <GymTab {...props} />}
      {tab === "money" && <MoneyTab {...props} />}
      {tab === "memos" && <MemosTab {...props} />}
      <LinksRow {...props} />
    </section>
  );
}

// ── Feed ─────────────────────────────────────────────────────────────────

function FeedTab({ hub, update, googleConnected }: Props) {
  const sources = hub.feeds ?? DEFAULT_FEEDS;
  const [topic, setTopic] = useState<FeedTopic | "All">("All");
  const [items, setItems] = useState<(FeedItem & { topic: FeedTopic })[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const key = sources.map((s) => s.url).join("|");

  useEffect(() => {
    if (!googleConnected) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await ensureSession();
        const q = new URLSearchParams();
        for (const s of sources) {
          q.append("u", s.url);
          q.append("n", s.name);
        }
        const res = await fetch(`/api/feed?${q}`, { headers: authHeaders() });
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Feed unavailable");
        const data = (await res.json()) as { sources: { url: string; items: FeedItem[]; error?: string }[] };
        if (cancelled) return;
        const byUrl = new Map(sources.map((s) => [s.url, s]));
        const all = data.sources.flatMap((r) => r.items.map((i) => ({ ...i, topic: byUrl.get(r.url)?.topic ?? "AI" })));
        all.sort((a, b) => (Date.parse(b.published ?? "") || 0) - (Date.parse(a.published ?? "") || 0));
        setItems(all);
        setFailed(data.sources.filter((r) => r.error).map((r) => byUrl.get(r.url)?.name ?? r.url));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Feed unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, googleConnected]);

  const shown = items.filter((i) => topic === "All" || i.topic === topic).slice(0, 12);

  if (editing) return <FeedEditor hub={hub} update={update} onDone={() => setEditing(false)} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="hud-label flex items-center gap-1.5">
          <Rss className="h-3.5 w-3.5" aria-hidden /> The Feed
        </p>
        <button type="button" className="btn-ghost p-1.5" onClick={() => setEditing(true)} aria-label="Edit feed sources">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {(["All", ...FEED_TOPICS] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`${pill} shrink-0 ${topic === t ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"}`}
            onClick={() => setTopic(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {!googleConnected && <p className="text-sm text-alfred-mist">Connect Google in Settings to load your feed.</p>}
      {error && <p className="text-sm text-amber-300/90">{error}</p>}
      {loading && !items.length && <p className="text-sm text-alfred-mist">Loading headlines…</p>}
      <ul className="space-y-2">
        {shown.map((i) => (
          <li key={i.link}>
            <a href={i.link} target="_blank" rel="noreferrer" className="block rounded-lg border border-alfred-border/60 px-3 py-2 hover:border-alfred-gold/40">
              <p className="text-sm leading-snug">{i.title}</p>
              <p className="mt-0.5 text-[11px] text-alfred-mist">
                {i.source} · {i.topic}
                {i.published ? ` · ${timeAgo(i.published)}` : ""}
              </p>
            </a>
          </li>
        ))}
        {!loading && googleConnected && !shown.length && !error && <li className="text-sm text-alfred-mist">Nothing new here yet.</li>}
      </ul>
      {failed.length > 0 && <p className="text-[11px] text-alfred-mist">Couldn't load: {failed.join(", ")}</p>}
    </div>
  );
}

function FeedEditor({ hub, update, onDone }: { hub: HubState; update: Props["update"]; onDone: () => void }) {
  const sources = hub.feeds ?? DEFAULT_FEEDS;
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState<FeedTopic>("Music");
  const set = (feeds: typeof sources) => update((h) => ({ ...h, feeds }));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="hud-label">Feed sources</p>
        <button type="button" className="btn-gold !py-1 text-xs" onClick={onDone}>
          Done
        </button>
      </div>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {s.name} <span className="text-[11px] text-alfred-mist">· {s.topic}</span>
            </span>
            <button type="button" className="btn-ghost p-1" onClick={() => set(sources.filter((x) => x.id !== s.id))} aria-label={`Remove ${s.name}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !isSafePublicUrl(url.trim())) return;
          set([...sources, { id: newId("f"), name: name.trim(), url: url.trim(), topic }]);
          setName("");
          setUrl("");
        }}
      >
        <input className="input-field" placeholder="Name (e.g. a YouTube channel)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Source name" />
        <input className="input-field" placeholder="RSS URL" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Feed URL" inputMode="url" />
        <div className="flex gap-2">
          <select className="input-field flex-1" value={topic} onChange={(e) => setTopic(e.target.value as FeedTopic)} aria-label="Topic">
            {FEED_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button type="submit" className="btn-gold" aria-label="Add source">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>
      <p className="text-[11px] text-alfred-mist leading-relaxed">
        YouTube channel: youtube.com/feeds/videos.xml?channel_id=… · Subreddit: reddit.com/r/NAME/.rss · Most sites: their /feed URL.
      </p>
      {hub.feeds && (
        <button type="button" className="text-[11px] text-alfred-mist underline" onClick={() => update((h) => ({ ...h, feeds: null }))}>
          Reset to defaults
        </button>
      )}
    </div>
  );
}

// ── Watchers ─────────────────────────────────────────────────────────────

function WatchTab({ hub, update, googleConnected }: Props) {
  const [state, setState] = useState<Record<string, WatchResult>>({});
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [lookFor, setLookFor] = useState("");

  const call = async (method: "GET" | "POST") => {
    await ensureSession();
    const res = await fetch("/api/watch-now", { method, headers: authHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Watchers unavailable");
    return (await res.json()) as { state: Record<string, WatchResult>; alerts: string[] };
  };

  useEffect(() => {
    if (!googleConnected) return;
    void call("GET").then((r) => setState(r.state)).catch(() => undefined);
  }, [googleConnected]);

  const checkNow = async () => {
    setChecking(true);
    setMsg(null);
    try {
      // Give the synced watcher list a moment to land on the server first.
      await new Promise((r) => setTimeout(r, 1800));
      const r = await call("POST");
      setState(r.state);
      setMsg(r.alerts.length ? r.alerts.join(" · ") : "Checked. No changes since last time.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Check failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="hud-label flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" aria-hidden /> Watchers
        </p>
        {hub.watchers.length > 0 && googleConnected && (
          <button type="button" className={`${pill} border-alfred-border/60 text-alfred-mist inline-flex items-center gap-1`} onClick={() => void checkNow()} disabled={checking}>
            <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} aria-hidden /> {checking ? "Checking" : "Check now"}
          </button>
        )}
      </div>
      <p className="text-xs text-alfred-mist">Alfred checks these pages every 3 hours and pings your phone when they change.</p>
      {!googleConnected && <p className="text-sm text-alfred-mist">Connect Google in Settings to use watchers.</p>}
      {msg && <p className="text-xs text-alfred-gold">{msg}</p>}
      <ul className="space-y-2">
        {hub.watchers.map((w) => {
          const r = state[w.id];
          const fresh = r?.changedAt && Date.now() - Date.parse(r.changedAt) < 3 * 86_400_000;
          return (
            <li key={w.id} className={`rounded-lg border px-3 py-2 text-sm ${fresh ? "border-alfred-gold/50" : "border-alfred-border/60"}`}>
              <div className="flex items-start justify-between gap-2">
                <a href={w.url} target="_blank" rel="noreferrer" className="min-w-0">
                  <p className="truncate">{w.name}</p>
                  <p className="text-[11px] text-alfred-mist truncate">{w.lookFor ? `Looking for "${w.lookFor}"` : "Any change"}</p>
                </a>
                <button type="button" className="btn-ghost p-1" onClick={() => update((h) => ({ ...h, watchers: h.watchers.filter((x) => x.id !== w.id) }))} aria-label={`Stop watching ${w.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[11px] font-mono text-alfred-mist">
                {!r
                  ? "Not checked yet"
                  : r.error
                    ? `Couldn't load (${r.error})`
                    : w.lookFor
                      ? r.found
                        ? `✓ Found${r.changedAt ? ` · ${timeAgo(r.changedAt)}` : ""}`
                        : `Not yet · checked ${timeAgo(r.checkedAt)}`
                      : fresh
                        ? `Changed ${timeAgo(r.changedAt)}`
                        : `No change · checked ${timeAgo(r.checkedAt)}`}
              </p>
              {fresh && r?.snippet && <p className="mt-1 text-xs text-alfred-cream/80">“{r.snippet}”</p>}
            </li>
          );
        })}
      </ul>
      <form
        className="grid gap-2 border-t border-alfred-border/40 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !isSafePublicUrl(url.trim())) {
            setMsg("Add a name and a full https:// link.");
            return;
          }
          update((h) => ({
            ...h,
            watchers: [...h.watchers, { id: newId("w"), name: name.trim(), url: url.trim(), lookFor: lookFor.trim() || undefined }].slice(0, 20),
          }));
          setName("");
          setUrl("");
          setLookFor("");
          setMsg(null);
        }}
      >
        <input className="input-field" placeholder="What is it? (e.g. Festival submissions)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Watcher name" />
        <input className="input-field" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Page URL" inputMode="url" />
        <div className="flex gap-2">
          <input className="input-field flex-1" placeholder='Optional: alert when it says… ("now open")' value={lookFor} onChange={(e) => setLookFor(e.target.value)} aria-label="Text to look for" />
          <button type="submit" className="btn-gold" aria-label="Add watcher">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>
      <p className="text-[11px] text-alfred-mist">
        <Bell className="inline h-3 w-3" aria-hidden /> Turn on notifications in Settings to get pinged.
      </p>
    </div>
  );
}

// ── Money ────────────────────────────────────────────────────────────────

function MoneyTab({ hub, update, today }: Props) {
  const month = today.slice(0, 7);
  const sum = useMemo(() => moneyMonth(hub.money, month), [hub.money, month]);
  const [kind, setKind] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<MoneyCategory>("Food");
  const [note, setNote] = useState("");
  const goal = hub.revenueGoal;
  const pct = goal ? Math.min(100, Math.round((sum.ecsRevenue / goal) * 100)) : 0;
  const nextGoal = REVENUE_LADDER.find((g) => g > goal);
  const recent = hub.money.filter((e) => e.date.startsWith(month)).slice(0, 8);
  const cats = kind === "in" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-3">
      <p className="hud-label flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5" aria-hidden /> {new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="hud-tile">
          <p className="font-mono text-[10px] uppercase text-alfred-mist">In</p>
          <p className="font-mono text-sm text-emerald-300">{money(sum.income)}</p>
        </div>
        <div className="hud-tile">
          <p className="font-mono text-[10px] uppercase text-alfred-mist">Out</p>
          <p className="font-mono text-sm text-amber-200">{money(sum.spent)}</p>
        </div>
        <div className="hud-tile">
          <p className="font-mono text-[10px] uppercase text-alfred-mist">Net</p>
          <p className={`font-mono text-sm ${sum.net >= 0 ? "text-alfred-gold" : "text-amber-300"}`}>{money(sum.net)}</p>
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between text-xs mb-1">
          <span className="text-alfred-mist">ECS revenue goal</span>
          <span className="font-mono text-alfred-mist">
            {money(sum.ecsRevenue)} of {money(goal)}
          </span>
        </div>
        <div className="hud-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        {sum.ecsRevenue >= goal && nextGoal && (
          <button type="button" className="mt-1 text-[11px] text-alfred-gold underline" onClick={() => update((h) => ({ ...h, revenueGoal: nextGoal }))}>
            Goal hit. Raise it to {money(nextGoal)}
          </button>
        )}
      </div>
      {sum.topSpend.length > 0 && (
        <p className="text-xs text-alfred-mist">Top spending: {sum.topSpend.map(([c, n]) => `${c} ${money(n)}`).join(" · ")}</p>
      )}
      <form
        className="grid gap-2 border-t border-alfred-border/40 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const amt = Number(amount);
          if (!Number.isFinite(amt) || amt <= 0) return;
          update((h) => ({
            ...h,
            money: [{ id: newId("m"), date: today, kind, amount: amt, category, note: note.trim() || undefined }, ...h.money].slice(0, 2000),
          }));
          setAmount("");
          setNote("");
        }}
      >
        <div className="flex gap-2">
          <div className="grid grid-cols-2 rounded-md border border-alfred-border/60 p-0.5 text-xs font-mono uppercase">
            {(["out", "in"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`rounded px-2.5 py-1 ${kind === k ? "bg-alfred-gold/20 text-alfred-gold" : "text-alfred-mist"}`}
                onClick={() => {
                  setKind(k);
                  setCategory(k === "in" ? "ECS" : "Food");
                }}
                aria-pressed={kind === k}
              >
                {k === "out" ? "Spent" : "Earned"}
              </button>
            ))}
          </div>
          <input className="input-field flex-1" type="number" min={0} step="0.01" inputMode="decimal" placeholder="$" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
        </div>
        <div className="flex gap-2">
          <select className="input-field w-36" value={category} onChange={(e) => setCategory(e.target.value as MoneyCategory)} aria-label="Category">
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className="input-field flex-1" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
          <button type="submit" className="btn-gold" aria-label="Add entry">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>
      <ul className="space-y-1">
        {recent.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {e.category}
              {e.note ? <span className="text-alfred-mist"> · {e.note}</span> : null}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs">
              <span className={e.kind === "in" ? "text-emerald-300" : "text-alfred-mist"}>
                {e.kind === "in" ? "+" : "−"}
                {money(e.amount)}
              </span>
              <button type="button" className="btn-ghost p-1" onClick={() => update((h) => ({ ...h, money: h.money.filter((x) => x.id !== e.id) }))} aria-label="Delete entry">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Voice memos ──────────────────────────────────────────────────────────

function MemosTab({ hub, update, onAddTodo }: Props) {
  const [draft, setDraft] = useState("");
  const speech = useSpeechInput((text) => setDraft((d) => (d ? `${d} ${text}` : text)));
  const [added, setAdded] = useState<string | null>(null);

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    update((h) => ({ ...h, memos: [{ id: newId("memo"), at: new Date().toISOString(), text }, ...h.memos].slice(0, 200) }));
    setDraft("");
  };

  const makeTodos = (id: string, text: string) => {
    const todos = extractTodos(text);
    todos.forEach((t) => onAddTodo(t));
    update((h) => ({ ...h, memos: h.memos.map((m) => (m.id === id ? { ...m, todosAdded: true } : m)) }));
    setAdded(todos.length ? `Added ${todos.length} to-do${todos.length === 1 ? "" : "s"}: ${todos.join(" · ")}` : "No to-dos found. Try “I need to…” or “remember to…”.");
  };

  return (
    <div className="space-y-3">
      <p className="hud-label flex items-center gap-1.5">
        <NotebookPen className="h-3.5 w-3.5" aria-hidden /> Voice memos
      </p>
      <div className="flex gap-2">
        <textarea
          className="input-field flex-1 h-20 resize-none text-sm"
          placeholder="Talk or type: ideas, lyrics, “I need to call…”"
          value={speech.listening && speech.interim ? `${draft} ${speech.interim}`.trim() : draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Memo"
        />
        <div className="flex flex-col gap-2">
          {speech.supported && (
            <button
              type="button"
              className={`btn-ghost p-2 border ${speech.listening ? "border-alfred-gold text-alfred-gold animate-pulse" : "border-alfred-border/60"}`}
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              aria-label={speech.listening ? "Stop recording" : "Record a voice memo"}
            >
              {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <button type="button" className="btn-gold p-2" onClick={save} aria-label="Save memo">
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
      {speech.error && <p className="text-xs text-amber-300/90">{speech.error}</p>}
      {added && <p className="text-xs text-alfred-gold">{added}</p>}
      <ul className="space-y-2">
        {hub.memos.slice(0, 10).map((m) => (
          <li key={m.id} className="rounded-lg border border-alfred-border/60 px-3 py-2">
            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-alfred-mist">
              <span>{timeAgo(m.at)}</span>
              <button
                type="button"
                className={`${pill} inline-flex items-center gap-1 ${m.todosAdded ? "border-alfred-border/40 opacity-60" : "border-alfred-border/60 hover:text-alfred-gold"}`}
                onClick={() => makeTodos(m.id, m.text)}
                disabled={m.todosAdded}
              >
                <ListPlus className="h-3 w-3" aria-hidden /> {m.todosAdded ? "To-dos added" : "Make to-dos"}
              </button>
              <PromptButton label="Organize" build={() => promptForMemo(m.text)} />
              <button type="button" className="btn-ghost p-1 ml-auto" onClick={() => update((h) => ({ ...h, memos: h.memos.filter((x) => x.id !== m.id) }))} aria-label="Delete memo">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
        {!hub.memos.length && <li className="text-xs text-alfred-mist">Tap the mic and talk. Alfred saves it and can pull out the to-dos.</li>}
      </ul>
    </div>
  );
}

// ── Quick links (Cal.com booking page, AppFlowy notes) ───────────────────

function LinksRow({ hub, update }: Props) {
  const [editing, setEditing] = useState(false);
  const [booking, setBooking] = useState(hub.links.booking ?? "");
  const [notes, setNotes] = useState(hub.links.notes ?? "");
  const [copied, setCopied] = useState(false);
  const { booking: b, notes: n } = hub.links;

  if (editing) {
    return (
      <form
        className="mt-4 grid gap-2 border-t border-alfred-border/40 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = (u: string) => (u.trim() && isSafePublicUrl(u.trim()) ? u.trim() : undefined);
          update((h) => ({ ...h, links: { booking: clean(booking), notes: clean(notes) } }));
          setEditing(false);
        }}
      >
        <input className="input-field" placeholder="Booking link (e.g. https://cal.com/yourname)" value={booking} onChange={(e) => setBooking(e.target.value)} aria-label="Booking link" inputMode="url" />
        <input className="input-field" placeholder="Notes app link (e.g. your AppFlowy workspace)" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes link" inputMode="url" />
        <button type="submit" className="btn-gold">
          Save links
        </button>
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-alfred-border/40 pt-3">
      {b ? (
        <>
          <a className={`${pill} inline-flex items-center gap-1 border-alfred-border/60 text-alfred-mist hover:text-alfred-gold`} href={b} target="_blank" rel="noreferrer">
            <CalendarPlus className="h-3 w-3" aria-hidden /> Booking page
          </a>
          <button
            type="button"
            className={`${pill} inline-flex items-center gap-1 border-alfred-border/60 text-alfred-mist hover:text-alfred-gold`}
            onClick={() => {
              void navigator.clipboard?.writeText(b).catch(() => undefined);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="h-3 w-3" aria-hidden /> {copied ? "Copied" : "Copy link"}
          </button>
        </>
      ) : null}
      {n && (
        <a className={`${pill} inline-flex items-center gap-1 border-alfred-border/60 text-alfred-mist hover:text-alfred-gold`} href={n} target="_blank" rel="noreferrer">
          <ExternalLink className="h-3 w-3" aria-hidden /> Notes
        </a>
      )}
      <button type="button" className="ml-auto text-[11px] text-alfred-mist underline" onClick={() => setEditing(true)}>
        {b || n ? "Edit links" : "Add booking & notes links"}
      </button>
    </div>
  );
}
