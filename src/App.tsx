import { useMemo } from "react";
import { OvernightDeltaBanner } from "./components/OvernightDeltaBanner";
import { OvercommitmentBanner } from "./components/OvercommitmentBanner";
import { MorningRitualModal } from "./components/MorningRitualModal";
import { WindDownBanner } from "./components/WindDownBanner";
import { CommandBar } from "./components/CommandBar";
import { TodayCommandCenter } from "./components/TodayCommandCenter";
import { WeeklyReview } from "./components/WeeklyReview";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { useSettings } from "./hooks/useSettings";
import { useWeather } from "./hooks/useWeather";
import { useTodos } from "./hooks/useTodos";
import { useGoogleIntegration, useSchedule } from "./hooks/useGoogle";
import { useEmails } from "./hooks/useEmails";
import { useWoodhouse } from "./hooks/useWoodhouse";
import { useStocks } from "./hooks/useStocks";
import { useCommute } from "./hooks/useCommute";
import { useUserDataSync } from "./hooks/useUserDataSync";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useOvernightDelta } from "./hooks/useOvernightDelta";
import { useFitness } from "./hooks/useFitness";
import { useShoppingList } from "./hooks/useShoppingList";
import { MealPrepPanel } from "./components/MealPrepPanel";
import { orchestrationToCalendarEvents } from "./lib/familyCalendar";
import { computeLeaveBy, filterTodayTimeline } from "./lib/leaveBy";
import { computeSuggestedBedtime, isWindDownTime } from "./lib/bedtime";
import { buildEveningWrap, isEveningMode } from "./lib/eveningWrap";
import { buildTodayQueue } from "./lib/todayQueue";
import { buildWeeklyReview, isWeeklyReviewTime } from "./lib/weeklyReview";
import { buildFitnessStatus } from "./lib/fitness";
import { assessOvercommitment } from "./lib/overcommitment";
import { useGoals2026 } from "./hooks/useGoals2026";
import { Goals2026Panel } from "./components/Goals2026Panel";
import { HudHeader, type SystemStatus } from "./components/hud/HudHeader";
import { CoreRing } from "./components/hud/CoreRing";
import {
  LoadPanel,
  LogPanel,
  NetworkPanel,
  RoadmapPanel,
  TerminalPanel,
  VitalsPanel,
} from "./components/hud/HudPanels";
import { InstallAppBanner } from "./components/InstallAppBanner";

export default function App() {
  const { settings, persist, updateCity, saving, error, setError } = useSettings();
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(settings);
  const { todos, pending, done, add, toggle, setTodos } = useTodos();
  const { connected, accountEmail, connect, disconnect, connectionError } = useGoogleIntegration();
  const { allEvents, addLocalEvent } = useSchedule(connected);
  const { messages, unread } = useEmails(connected);
  const { snapshot: woodhouse, loading: woodhouseLoading, error: woodhouseError } = useWoodhouse();
  const { snapshot: stocks, loading: stocksLoading } = useStocks();
  const { effectiveMinutes, loading: commuteLoading, error: commuteError } = useCommute(settings);
  const { logs: fitnessLogs, logWorkout, loadRemote: loadFitness } = useFitness(settings);
  const { items: shoppingItems, add: addShopping, togglePantry, remove: removeShopping, loadRemote: loadShopping } = useShoppingList();
  const { progress: goalsProgress, toggleTrip, toggleMwfs, toggleAiAgents } = useGoals2026();

  useUserDataSync(settings, persist, todos, setTodos, loadFitness, loadShopping);
  const push = usePushNotifications(settings.pushNotificationsEnabled);

  const familyScheduleEvents = useMemo(
    () => (woodhouse ? orchestrationToCalendarEvents(woodhouse) : []),
    [woodhouse],
  );

  const allSchedule = useMemo(() => {
    return [...familyScheduleEvents, ...allEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }, [allEvents, familyScheduleEvents]);

  const todayTimeline = useMemo(
    () => filterTodayTimeline(allSchedule, settings.timezone),
    [allSchedule, settings.timezone],
  );

  const leaveBy = useMemo(
    () => computeLeaveBy(settings, woodhouse, allSchedule, new Date(), new Date(), effectiveMinutes),
    [settings, woodhouse, allSchedule, effectiveMinutes],
  );

  const tomorrowLeaveBy = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return computeLeaveBy(settings, woodhouse, allSchedule, new Date(), tomorrow, effectiveMinutes);
  }, [settings, woodhouse, allSchedule, effectiveMinutes]);

  const bedtime = useMemo(
    () => computeSuggestedBedtime(settings, tomorrowLeaveBy),
    [settings, tomorrowLeaveBy],
  );

  const todayActions = useMemo(
    () => buildTodayQueue(pending, woodhouse),
    [pending, woodhouse],
  );

  const urgentCount = todayActions.filter((a) => a.urgent).length;

  const fitnessStatus = useMemo(
    () => buildFitnessStatus(settings, fitnessLogs, allSchedule),
    [settings, fitnessLogs, allSchedule],
  );

  const overcommitment = useMemo(
    () => assessOvercommitment(pending, urgentCount, todayTimeline),
    [pending, urgentCount, todayTimeline],
  );

  const overnightDelta = useOvernightDelta(
    unread,
    pending,
    done,
    urgentCount,
    stocks,
    woodhouse,
    todayTimeline.length,
    messages,
  );

  const eveningWrap = useMemo(
    () =>
      buildEveningWrap(
        settings,
        weather,
        pending,
        done,
        todayActions,
        allSchedule,
        woodhouse,
        tomorrowLeaveBy,
      ),
    [settings, weather, pending, done, todayActions, allSchedule, woodhouse, tomorrowLeaveBy],
  );

  const eveningMode = isEveningMode(settings);
  const showWindDown = bedtime && isWindDownTime(bedtime) && !eveningMode;
  const weeklyReview = useMemo(
    () => buildWeeklyReview(settings, pending, done, allSchedule, woodhouse, shoppingItems, goalsProgress),
    [settings, pending, done, allSchedule, woodhouse, shoppingItems, goalsProgress],
  );
  const showWeeklyReview = isWeeklyReviewTime(settings);

  const displayName = accountEmail?.split("@")[0];

  const systemStatus: SystemStatus = useMemo(() => {
    if (woodhouseError && !woodhouse) return "offline";
    const nodes = woodhouse?.nodes ?? [];
    if (!nodes.length) return woodhouseLoading ? "ok" : "offline";
    return nodes.every((n) => n.ok) ? "ok" : "degraded";
  }, [woodhouse, woodhouseError, woodhouseLoading]);

  const terminalLines = useMemo(() => {
    const next = todayTimeline.find((e) => new Date(e.start).getTime() > Date.now());
    const lines = [
      urgentCount
        ? `${urgentCount} urgent · ${pending.length} open tasks · ${unread} unread`
        : `No urgent items · ${pending.length} open tasks · ${unread} unread`,
    ];
    if (next) {
      lines.push(
        `Next: ${next.title} at ${new Date(next.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      );
    }
    if (leaveBy) {
      lines.push(
        `Leave by ${leaveBy.leaveBy.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} → ${leaveBy.destination}`,
      );
    }
    return lines;
  }, [todayTimeline, urgentCount, pending.length, unread, leaveBy]);

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="hud-vignette" aria-hidden />
      <div className="hud-scanline" aria-hidden />
      <HudHeader
        timeZone={settings.timezone}
        status={systemStatus}
        alerts={urgentCount}
        operator={displayName ? displayName.slice(0, 1).toUpperCase() + "." : "E."}
      />

      <main className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
        {/* Operator console: status | core | ECS */}
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <div className="space-y-4 order-2 xl:order-1">
            <VitalsPanel weather={weather} city={settings.city} fitness={fitnessStatus} />
            <LoadPanel
              pending={pending}
              done={done}
              unread={unread}
              todayEvents={todayTimeline.length}
              timeZone={settings.timezone}
            />
            <NetworkPanel woodhouse={woodhouse} googleConnected={connected} />
          </div>

          <div className="order-1 xl:order-2 flex flex-col items-center justify-center gap-6 py-4 xl:py-10">
            <div className="w-full max-w-[260px] sm:max-w-[360px] xl:max-w-[420px]">
              <CoreRing
                lines={systemStatus === "ok" ? ["ALFRED", "ONLINE"] : systemStatus === "degraded" ? ["ALFRED", "DEGRADED"] : ["ALFRED", "OFFLINE"]}
                status={systemStatus}
              />
            </div>
            <CommandBar
              variant="hud"
              settings={settings}
              leaveBy={leaveBy}
              bedtime={bedtime}
              onAddTodo={add}
              onLogWorkout={logWorkout}
              onAddEvent={addLocalEvent}
              onAddShopping={addShopping}
            />
          </div>

          <div className="space-y-4 order-3">
            <RoadmapPanel woodhouse={woodhouse} />
            <LogPanel timeline={todayTimeline} woodhouse={woodhouse} messages={messages} timeZone={settings.timezone} />
            <TerminalPanel lines={terminalLines} />
          </div>
        </div>

        {showWeeklyReview && <WeeklyReview review={weeklyReview} />}
        <InstallAppBanner />
        <OvernightDeltaBanner delta={overnightDelta} />
        {overcommitment && <OvercommitmentBanner warning={overcommitment} />}
        {showWindDown && <WindDownBanner bedtime={bedtime} />}

        {commuteError && settings.useLiveCommute && (
          <p className="text-sm text-amber-300/90 panel px-4 py-2">{commuteError}</p>
        )}
        {commuteLoading && settings.useLiveCommute && (
          <p className="text-xs text-alfred-mist">Updating live commute…</p>
        )}
        <TodayCommandCenter
          settings={settings}
          weather={weather}
          weatherLoading={weatherLoading}
          weatherError={weatherError}
          leaveBy={leaveBy}
          tomorrowLeaveBy={tomorrowLeaveBy}
          bedtime={bedtime}
          eveningWrap={eveningWrap}
          eveningMode={eveningMode}
          displayName={displayName}
          unreadEmails={unread}
          actions={todayActions}
          todayTimeline={todayTimeline}
          allSchedule={allSchedule}
          woodhouse={woodhouse}
          woodhouseLoading={woodhouseLoading}
          woodhouseError={woodhouseError}
          stocks={stocks}
          stocksLoading={stocksLoading}
          messages={messages}
          googleConnected={connected}
          fitnessLogs={fitnessLogs}
          onConnectGoogle={() => void connect()}
          onToggleTodo={toggle}
          onAddTodo={add}
          onLogWorkout={logWorkout}
          pendingTodos={pending}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Goals2026Panel
            settings={settings}
            progress={goalsProgress}
            onToggleTrip={toggleTrip}
            onToggleMwfs={toggleMwfs}
            onToggleAiAgents={toggleAiAgents}
          />
          <MealPrepPanel
            settings={settings}
            items={shoppingItems}
            onAdd={addShopping}
            onToggle={togglePantry}
            onRemove={removeShopping}
          />
        </div>
      </main>

      <MorningRitualModal
        settings={settings}
        fitness={fitnessStatus}
        leaveBy={leaveBy}
        onLogWorkout={logWorkout}
      />

      <SettingsDrawer
        settings={settings}
        googleConnected={connected}
        accountEmail={accountEmail}
        googleConnectionError={connectionError}
        push={push}
        onSaveCity={async (city) => {
          setError(null);
          return updateCity(city);
        }}
        onSaveWoodhouseNodes={(nodes) => {
          persist({ ...settings, woodhouseNodes: nodes });
        }}
        onSaveCommute={(patch) => {
          persist({ ...settings, ...patch });
        }}
        onSaveNotifications={async (patch) => {
          persist({ ...settings, ...patch });
          if (patch.pushNotificationsEnabled) {
            await push.enable();
          }
        }}
        onConnectGoogle={() => void connect()}
        onDisconnectGoogle={() => void disconnect()}
        saving={saving}
        error={error}
      />
    </div>
  );
}
