import { useMemo } from "react";
import { OvernightDeltaBanner } from "./components/OvernightDeltaBanner";
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
import { computeSuggestedBedtime } from "./lib/bedtime";
import { buildEveningWrap, isEveningMode } from "./lib/eveningWrap";
import { buildTodayQueue } from "./lib/todayQueue";
import { buildWeeklyReview, isWeeklyReviewTime } from "./lib/weeklyReview";

export default function App() {
  const { settings, persist, updateCity, saving, error, setError } = useSettings();
  const { weather } = useWeather(settings);
  const { todos, pending, done, add, toggle, setTodos } = useTodos();
  const { connected, accountEmail, connect, disconnect } = useGoogleIntegration();
  const { allEvents, addLocalEvent } = useSchedule(connected);
  const { messages, unread } = useEmails(connected);
  const { snapshot: woodhouse } = useWoodhouse();
  const { snapshot: stocks } = useStocks();
  const { effectiveMinutes, loading: commuteLoading, error: commuteError } = useCommute(settings);
  const { logs: fitnessLogs, logWorkout, loadRemote: loadFitness } = useFitness(settings);
  const { items: shoppingItems, add: addShopping, togglePantry, remove: removeShopping, loadRemote: loadShopping } = useShoppingList();

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
  const weeklyReview = useMemo(
    () => buildWeeklyReview(settings, pending, done, allSchedule, woodhouse, shoppingItems),
    [settings, pending, done, allSchedule, woodhouse, shoppingItems],
  );
  const showWeeklyReview = isWeeklyReviewTime(settings);

  const displayName = accountEmail?.split("@")[0];

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-alfred-border/80 bg-alfred-panel/50 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-alfred-gold">Personal assistant</p>
            <h1 className="font-display text-3xl font-semibold">Alfred</h1>
          </div>
          <span className="text-4xl" aria-hidden>
            🎩
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {showWeeklyReview && <WeeklyReview review={weeklyReview} />}
        <OvernightDeltaBanner delta={overnightDelta} />
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
          leaveBy={leaveBy}
          tomorrowLeaveBy={tomorrowLeaveBy}
          eveningWrap={eveningWrap}
          eveningMode={eveningMode}
          displayName={displayName}
          unreadEmails={unread}
          actions={todayActions}
          todayTimeline={todayTimeline}
          allSchedule={allSchedule}
          woodhouse={woodhouse}
          stocks={stocks}
          messages={messages}
          googleConnected={connected}
          fitnessLogs={fitnessLogs}
          onConnectGoogle={connect}
          onToggleTodo={toggle}
          onAddTodo={add}
          onLogWorkout={logWorkout}
          pendingTodos={pending}
        />
      </main>

      <SettingsDrawer
        settings={settings}
        googleConnected={connected}
        accountEmail={accountEmail}
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
        onConnectGoogle={connect}
        onDisconnectGoogle={() => void disconnect()}
        saving={saving}
        error={error}
      />
    </div>
  );
}
