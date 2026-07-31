import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "../types";
import type { EmailMessage } from "../types";
import type { UserSettings } from "../types";
import type { StocksSnapshot } from "../types/stocks";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import type { WeatherSnapshot } from "../types";
import type { TodoItem } from "../types";
import type { LeaveByPlan } from "../lib/leaveBy";
import type { BedtimePlan } from "../lib/bedtime";
import type { TodayAction } from "../lib/todayQueue";
import type { EveningWrap } from "../lib/eveningWrap";
import { isPastLightsOut, isWindDownTime } from "../lib/bedtime";
import { getDailyQuote } from "../lib/dailyQuote";
import { weatherLabel } from "../lib/weather";
import type { FitnessLog } from "../types";
import type { WorkoutType } from "../lib/fitness";
import { FitnessPanel } from "./FitnessPanel";
import {
  AlertCircle,
  Bot,
  Calendar,
  Check,
  Clock,
  CloudSun,
  ListPlus,
  Mail,
  Moon,
  Package,
  Plane,
  Quote,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface Props {
  settings: UserSettings;
  weather: WeatherSnapshot | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
  leaveBy: LeaveByPlan | null;
  tomorrowLeaveBy: LeaveByPlan | null;
  bedtime: BedtimePlan;
  eveningWrap: EveningWrap;
  eveningMode: boolean;
  displayName?: string;
  unreadEmails: number;
  actions: TodayAction[];
  todayTimeline: CalendarEvent[];
  allSchedule: CalendarEvent[];
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  woodhouseLoading?: boolean;
  woodhouseError?: string | null;
  stocks: StocksSnapshot | null;
  stocksLoading?: boolean;
  messages: EmailMessage[];
  googleConnected: boolean;
  fitnessLogs: FitnessLog[];
  onConnectGoogle: () => void;
  onToggleTodo: (id: string) => void;
  onAddTodo: (title: string) => void;
  onLogWorkout: (type: WorkoutType) => void;
  pendingTodos: TodoItem[];
}

export function TodayCommandCenter({
  settings,
  weather,
  weatherLoading,
  weatherError,
  leaveBy,
  tomorrowLeaveBy,
  bedtime,
  eveningWrap,
  eveningMode,
  displayName,
  unreadEmails,
  actions,
  todayTimeline,
  allSchedule,
  woodhouse,
  woodhouseLoading,
  woodhouseError,
  stocks,
  stocksLoading,
  messages,
  googleConnected,
  fitnessLogs,
  onConnectGoogle,
  onToggleTodo,
  onAddTodo,
  onLogWorkout,
  pendingTodos,
}: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const movers = [...(stocks?.watchlist ?? [])]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 3);

  const dailyQuote = useMemo(() => getDailyQuote(settings.timezone), [settings.timezone]);

  return (
    <div className="space-y-4">
      {/* Hero — leave by + status chips */}
      <section className="panel-hud p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="hud-label mb-1">Status · Today</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-wide">
              {greeting}{displayName ? `, ${displayName}` : ""}
            </h2>
            {weatherLoading && (
              <p className="text-alfred-mist mt-2 flex items-center gap-2 text-sm">
                <CloudSun className="h-4 w-4 text-alfred-gold/50 shrink-0 animate-pulse" />
                Loading forecast…
              </p>
            )}
            {weatherError && !weather && (
              <p className="text-alfred-mist/80 mt-2 text-sm">{weatherError}</p>
            )}
            {weather && (
              <p className="text-alfred-mist mt-2 flex items-center gap-2 text-sm">
                <CloudSun className="h-4 w-4 text-alfred-gold shrink-0" />
                {Math.round(weather.temperature)}° · {weatherLabel(weather.weatherCode)} · Sunset{" "}
                {format(parseISO(weather.sunset), "h:mm a")} · {settings.city}
              </p>
            )}
            <blockquote className="mt-4 border-l-2 border-green-400/50 pl-4 max-w-xl">
              <p className="text-sm text-alfred-cream/90 leading-relaxed flex gap-2 font-mono">
                <Quote className="h-4 w-4 text-alfred-gold/70 shrink-0 mt-0.5" aria-hidden />
                <span>&ldquo;{dailyQuote.text}&rdquo;</span>
              </p>
              <footer className="text-xs text-alfred-mist mt-1.5 pl-6">— {dailyQuote.author}</footer>
            </blockquote>
          </div>
          {leaveBy && (
            <div className="panel-hud px-5 py-4 shrink-0 animate-hud-pulse">
              <p className="hud-label flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Departure window
              </p>
              <p className="font-mono text-4xl font-semibold text-alfred-cream mt-1 hud-glow-text">
                {format(leaveBy.leaveBy, "h:mm a")}
              </p>
              <p className="text-sm text-alfred-mist mt-1">
                → {leaveBy.destination}
              </p>
              {leaveBy.scheduleLabel && (
                <p className="text-xs text-alfred-gold/90 mt-1">{leaveBy.scheduleLabel}</p>
              )}
              <p className="text-xs text-alfred-mist/80">
                Arrive {format(leaveBy.arriveBy, "h:mm a")} ({leaveBy.reason}) · {leaveBy.commuteMinutes}
                min drive + {leaveBy.bufferMinutes} min buffer
                {leaveBy.dismissal ? ` · ${leaveBy.dismissal}` : ""}
              </p>
              {leaveBy.reason.includes("leave now") && (
                <p className="text-xs text-amber-300/90 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Running late — adjust in Settings
                </p>
              )}
            </div>
          )}
          {!leaveBy && !eveningMode && isWindDownTime(bedtime) && (
            <BedtimeCard bedtime={bedtime} />
          )}
          {!leaveBy && eveningMode && (tomorrowLeaveBy || eveningWrap.bedtime) && (
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {tomorrowLeaveBy && (
                <div className="panel border-alfred-border/60 px-5 py-4 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-alfred-mist flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Tomorrow
                  </p>
                  <p className="font-display text-2xl font-semibold text-alfred-cream mt-1">
                    Leave by {format(tomorrowLeaveBy.leaveBy, "h:mm a")}
                  </p>
                  <p className="text-xs text-alfred-mist/80 mt-1">
                    {tomorrowLeaveBy.scheduleLabel ?? tomorrowLeaveBy.reason}
                    {tomorrowLeaveBy.dismissal ? ` · ${tomorrowLeaveBy.dismissal}` : ""}
                  </p>
                </div>
              )}
              {eveningWrap.bedtime && (
                <BedtimeCard bedtime={eveningWrap.bedtime} />
              )}
            </div>
          )}
          {!leaveBy && !eveningMode && !isWindDownTime(bedtime) && (
            <div className="panel border-alfred-border/40 px-5 py-4 rounded-xl shrink-0">
              <p className="text-xs uppercase tracking-wider text-alfred-mist flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Schedule
              </p>
              <p className="text-sm text-alfred-mist mt-1">No leave-by window right now — calendar looks clear.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Chip label={`${pendingTodos.length} tasks`} alert={pendingTodos.length > 5} />
          <Chip label={`${unreadEmails} unread`} alert={unreadEmails > 0} />
          <Chip
            label={`${actions.filter((a) => a.urgent).length} urgent`}
            alert={actions.filter((a) => a.urgent).length > 0}
          />
          <Chip label={`${todayTimeline.length} on calendar`} />
          <Chip label={`${woodhouse?.nodes.filter((n) => n.ok).length ?? 0}/${woodhouse?.nodes.length ?? 0} apps online`} />
        </div>
      </section>

      {eveningMode && (
        <section className="panel p-5 border-green-500/25 bg-gradient-to-br from-green-950/40 to-alfred-panel/30">
          <h3 className="font-display text-lg text-alfred-gold mb-3 flex items-center gap-2 tracking-wide">
            <Moon className="h-4 w-4" /> {eveningWrap.headline.toUpperCase()}
          </h3>
          <blockquote className="border-l-2 border-alfred-gold/40 pl-4 mb-4">
            <p className="text-sm text-alfred-cream/90 italic">&ldquo;{eveningWrap.quote.text}&rdquo;</p>
            <footer className="text-xs text-alfred-mist mt-1">— {eveningWrap.quote.author}</footer>
          </blockquote>
          <ul className="space-y-2 text-sm text-alfred-mist">
            {eveningWrap.lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 mt-4">
            <Chip label={`${eveningWrap.completedToday} done today`} />
            <Chip label={`${eveningWrap.remainingTasks} open`} alert={eveningWrap.remainingTasks > 0} />
            {eveningWrap.stillUrgent > 0 && (
              <Chip label={`${eveningWrap.stillUrgent} urgent`} alert />
            )}
            {eveningWrap.bedtime && (
              <Chip
                label={`Lights out ${format(eveningWrap.bedtime.lightsOut, "h:mm a")}`}
                alert={isPastLightsOut(eveningWrap.bedtime)}
              />
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Actions + timeline — main column */}
        <div className="lg:col-span-7 space-y-4">
          <section className="panel p-5">
            <h3 className="font-display text-lg text-alfred-gold mb-3">Do today</h3>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {actions.length === 0 && (
                <li className="text-sm text-alfred-mist">All clear — nothing queued.</li>
              )}
              {actions.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                    a.urgent ? "border-alfred-gold/40 bg-alfred-gold/5" : "border-alfred-border/60"
                  }`}
                >
                  {a.todoId ? (
                    <button
                      type="button"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border border-alfred-border hover:border-alfred-gold"
                      onClick={() => onToggleTodo(a.todoId!)}
                      aria-label="Complete task"
                    />
                  ) : (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-alfred-gold" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p>{a.title}</p>
                    <p className="text-xs text-alfred-mist capitalize">{a.sourceLabel}</p>
                  </div>
                </li>
              ))}
            </ul>
            <QuickAdd onAdd={onAddTodo} />
          </section>

          <FitnessPanel
            settings={settings}
            logs={fitnessLogs}
            events={allSchedule}
            onLog={onLogWorkout}
          />

          <section className="panel p-5">
            <h3 className="font-display text-lg text-alfred-gold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Today&apos;s timeline
            </h3>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {todayTimeline.length === 0 && (
                <li className="text-sm text-alfred-mist">Nothing else on the calendar today.</li>
              )}
              {todayTimeline.map((ev) => (
                <li
                  key={`${ev.source}-${ev.id}`}
                  className="flex gap-3 rounded-lg border border-alfred-border/60 px-3 py-2 bg-alfred-ink/30"
                >
                  <span className="text-xs text-alfred-gold w-16 shrink-0 pt-0.5">
                    {format(parseISO(ev.start), "h:mm a")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-alfred-mist capitalize">{ev.source.replace("-", " ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right rail — apps, markets, inbox */}
        <div className="lg:col-span-5 space-y-4">
          <section className="panel p-5">
            <h3 className="font-display text-lg text-alfred-gold mb-3">Your apps</h3>
            <div className="space-y-2">
              {woodhouseLoading && !woodhouse && (
                <p className="text-sm text-alfred-mist animate-pulse">Syncing Woodhouse apps…</p>
              )}
              {woodhouseError && !woodhouse && (
                <p className="text-sm text-amber-300/90">{woodhouseError}</p>
              )}
              {!woodhouseLoading && (!woodhouse || woodhouse.nodes.length === 0) && (
                <p className="text-sm text-alfred-mist">
                  No apps registered yet — open Settings → Woodhouse apps to connect Easy Supply, Family Purpose, and more.
                </p>
              )}
              {woodhouse?.nodes.map((node) => (
                <div
                  key={node.registryId}
                  className="rounded-lg border border-alfred-border/60 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium flex items-center gap-1.5">
                      {node.nodeType === "commerce" ? (
                        <Package className="h-3.5 w-3.5 text-alfred-gold" />
                      ) : node.nodeType === "education" ? (
                        <Bot className="h-3.5 w-3.5 text-alfred-gold" />
                      ) : (
                        <Plane className="h-3.5 w-3.5 text-alfred-gold" />
                      )}
                      {node.displayName}
                    </span>
                    <span className={`text-xs ${node.ok ? "text-emerald-400/80" : "text-red-300"}`}>
                      {node.ok ? "online" : "offline"}
                    </span>
                  </div>
                  {node.snapshot?.summary && (
                    <p className="text-xs text-alfred-mist mt-1">{node.snapshot.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="font-display text-lg text-alfred-gold mb-3">Markets</h3>
            {stocksLoading && !stocks && (
              <p className="text-sm text-alfred-mist animate-pulse">Loading markets…</p>
            )}
            {!stocksLoading && movers.length === 0 && <p className="text-sm text-alfred-mist">No market data.</p>}
            <ul className="space-y-2">
              {movers.map((q) => (
                <li key={q.symbol} className="flex justify-between text-sm">
                  <span>
                    {q.symbol}{" "}
                    <span className="text-xs text-alfred-mist">{q.theme}</span>
                  </span>
                  <span className={q.changePercent >= 0 ? "text-emerald-400/90" : "text-red-300/90"}>
                    {q.changePercent >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                    {" "}
                    {q.changePercent.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
            {stocks && stocks.upcomingIpos[0] && (
              <p className="text-xs text-alfred-mist mt-3 border-t border-alfred-border pt-2">
                IPO watch: {stocks.upcomingIpos[0].name} ({stocks.upcomingIpos[0].date})
              </p>
            )}
          </section>

          <section className="panel p-5">
            <h3 className="font-display text-lg text-alfred-gold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Inbox
            </h3>
            {!googleConnected && (
              <button type="button" className="btn-gold w-full text-sm" onClick={onConnectGoogle}>
                Connect Gmail
              </button>
            )}
            {googleConnected && messages.length === 0 && (
              <p className="text-sm text-alfred-mist">Inbox clear.</p>
            )}
            <ul className="space-y-2">
              {messages.slice(0, 4).map((m) => (
                <li
                  key={m.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    m.unread ? "border-alfred-gold/30 bg-alfred-gold/5" : "border-alfred-border/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{m.subject}</p>
                      <p className="text-xs text-alfred-mist truncate">{m.from}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost p-1.5 shrink-0 border border-alfred-border/60 rounded"
                      title="Add as task"
                      onClick={() => onAddTodo(`Reply: ${m.subject}`)}
                    >
                      <ListPlus className="h-3.5 w-3.5 text-alfred-gold" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function BedtimeCard({ bedtime }: { bedtime: BedtimePlan }) {
  const now = new Date();
  const pastLights = isPastLightsOut(bedtime, now);
  const windingDown = isWindDownTime(bedtime, now) && !pastLights;

  return (
    <div
      className={`panel px-5 py-4 rounded-xl ${
        pastLights
          ? "border-amber-400/40 bg-amber-400/5"
          : windingDown
            ? "border-alfred-gold/50 bg-alfred-gold/10"
            : "border-alfred-border/60"
      }`}
    >
      <p className="hud-label flex items-center gap-1">
        <Moon className="h-3.5 w-3.5" /> Sleep protocol
      </p>
      <p className="font-mono text-2xl font-semibold text-alfred-cream mt-1 hud-glow-text">
        {format(bedtime.lightsOut, "h:mm a")}
      </p>
      <p className="text-xs text-alfred-mist/80 mt-1">
        Wind down {format(bedtime.windDownStart, "h:mm a")} · Wake {format(bedtime.wakeUp, "h:mm a")}
      </p>
      <p className="text-xs text-alfred-mist/70 mt-1">{bedtime.reason}</p>
      {bedtime.earlyWake && (
        <p className="text-xs text-alfred-gold/90 mt-2">Early alarm tomorrow based on your schedule</p>
      )}
      {windingDown && (
        <p className="text-xs text-alfred-gold mt-2">Wind-down time — start your evening routine</p>
      )}
      {pastLights && (
        <p className="text-xs text-amber-300/90 mt-2">Past lights-out — rest when you can</p>
      )}
    </div>
  );
}

function Chip({ label, alert }: { label: string; alert?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        alert ? "border-alfred-gold/50 bg-alfred-gold/10 text-alfred-gold" : "border-alfred-border text-alfred-mist"
      }`}
    >
      {label}
    </span>
  );
}

function QuickAdd({ onAdd }: { onAdd: (t: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex gap-2 mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text);
        setText("");
      }}
    >
      <input
        className="input-field flex-1 text-sm"
        placeholder="Add a task for today…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn-gold px-3">
        <Check className="h-4 w-4" />
      </button>
    </form>
  );
}