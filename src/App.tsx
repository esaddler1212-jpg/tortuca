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
import { HudRing } from "./components/HudRing";
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

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="hud-vignette" aria-hidden />
      <div className="hud-scanline" aria-hidden />
      <header className="border-b border-green-500/20 bg-alfred-panel/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="hud-label mb-1">Operator interface</p>
            <h1 className="font-display text-3xl font-bold tracking-[0.15em] text-alfred-cream hud-glow-text">
              ALFRED
            </h1>
          </div>
          <HudRing className="h-11 w-11" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {showWeeklyReview && <WeeklyReview review={weeklyReview} />}
        <InstallAppBanner />
        <Goals2026Panel
          settings={settings}
          progress={goalsProgress}
          onToggleTrip={toggleTrip}
          onToggleMwfs={toggleMwfs}
          onToggleAiAgents={toggleAiAgents}
        />
        <OvernightDeltaBanner delta={overnightDelta} />
        {overcommitment && <OvercommitmentBanner warning={overcommitment} />}
        {showWindDown && <WindDownBanner bedtime={bedtime} />}
        <CommandBar
          settings={settings}
          leaveBy={leaveBy}
          bedtime={bedtime}
          onAddTodo={add}
          onLogWorkout={logWorkout}
          onAddEvent={addLocalEvent}
          onAddShopping={addShopping}
        />
        <MealPrepPanel
          settings={settings}
          items={shoppingItems}
          onAdd={addShopping}
          onToggle={togglePantry}
          onRemove={removeShopping}
        />
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
