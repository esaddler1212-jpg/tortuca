import { useEffect, useMemo } from "react";
import { useNow } from "./hooks/useNow";
import { nextWakeDay } from "../shared/bedtime";
import { dayKey, weekdayOfDay, zonedDateTime } from "../shared/timezone";
import { applyDayMode, dayMode, DAY_MODE_LABEL } from "../shared/dayMode";
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
import { WeekWeatherPanel } from "./components/hud/WeekWeatherPanel";
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
  // Re-evaluates all time-of-day logic every minute and when the app is reopened.
  const now = useNow();
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(settings);
  const { todos, pending, done, add, toggle, setTodos } = useTodos();
  const { connected, accountEmail, connect, disconnect, connectionError } = useGoogleIntegration();
  const { allEvents, addLocalEvent } = useSchedule(connected);
  const { messages, unread } = useEmails(connected);
  const { snapshot: rawWoodhouse, loading: woodhouseLoading, error: woodhouseError } = useWoodhouse();
  // Workday vs off duty: Family Purpose tasks hide on weekends, holidays and after 7 PM.
  const mode = dayMode(settings.timezone, now);
  const woodhouse = useMemo(() => applyDayMode(rawWoodhouse, mode), [rawWoodhouse, mode]);

  // Theme follows the focus: blue school hours, green ECS Network, purple weekends.
  useEffect(() => {
    document.documentElement.dataset.focus = mode;
    const themeColor = { school: "#22d3ee", network: "#4ade80", weekend: "#c084fc", holiday: "#c084fc" }[mode];
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  }, [mode]);
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

  // Calendar day of the next wake-up (today if it's after midnight but before the alarm).
  const wakeDay = nextWakeDay(settings, now);

  const todayTimeline = useMemo(
    () => filterTodayTimeline(allSchedule, settings.timezone),
    // `now` keeps "today" correct after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSchedule, settings.timezone, wakeDay],
  );

  const leaveBy = useMemo(
    () => computeLeaveBy(settings, rawWoodhouse, allSchedule, now, now, effectiveMinutes),
    [settings, rawWoodhouse, allSchedule, effectiveMinutes, now],
  );

  // Leave-by for the next wake-up morning (drives bedtime and the "tomorrow" preview).
  const tomorrowLeaveBy = useMemo(() => {
    const wakeMorning = zonedDateTime(wakeDay, "12:00", settings.timezone);
    return computeLeaveBy(settings, rawWoodhouse, allSchedule, now, wakeMorning, effectiveMinutes);
  }, [settings, rawWoodhouse, allSchedule, effectiveMinutes, now, wakeDay]);

  const bedtime = useMemo(
    () => computeSuggestedBedtime(settings, tomorrowLeaveBy, now),
    [settings, tomorrowLeaveBy, now],
  );

  const todayActions = useMemo(
    () => buildTodayQueue(pending, woodhouse),
    [pending, woodhouse],
  );

  const urgentCount = todayActions.filter((a) => a.urgent).length;

  const fitnessStatus = useMemo(
    () => buildFitnessStatus(settings, fitnessLogs, allSchedule, now),
    [settings, fitnessLogs, allSchedule, now],
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
        now,
      ),
    [settings, weather, pending, done, todayActions, allSchedule, woodhouse, tomorrowLeaveBy, now],
  );

  const eveningMode = isEveningMode(settings, now);
  const showWindDown = bedtime && isWindDownTime(bedtime, now) && !eveningMode;
  const weeklyReview = useMemo(
    () => buildWeeklyReview(settings, pending, done, allSchedule, woodhouse, shoppingItems, goalsProgress),
    [settings, pending, done, allSchedule, woodhouse, shoppingItems, goalsProgress],
  );
  const showWeeklyReview = isWeeklyReviewTime(settings, now);

  const displayName = settings.preferredName?.trim() || accountEmail?.split("@")[0];

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

  // Sunday: plan the week (week-ahead weather under the greeting).
  const isSunday = weekdayOfDay(dayKey(settings.timezone, now)) === "Sun";

  const coreLines: [string, string] =
    systemStatus === "ok" ? ["ALFRED", "ONLINE"] : systemStatus === "degraded" ? ["ALFRED", "DEGRADED"] : ["ALFRED", "OFFLINE"];

  const statusPanels = (
    <>
      <VitalsPanel weather={weather} city={settings.city} fitness={fitnessStatus} />
      <LoadPanel
        pending={pending}
        done={done}
        unread={unread}
        todayEvents={todayTimeline.length}
        timeZone={settings.timezone}
      />
      <NetworkPanel woodhouse={woodhouse} googleConnected={connected} />
    </>
  );

  const ecsPanels = (
    <>
      <RoadmapPanel woodhouse={woodhouse} />
      <LogPanel timeline={todayTimeline} woodhouse={woodhouse} messages={messages} timeZone={settings.timezone} />
      <TerminalPanel lines={terminalLines} />
    </>
  );

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
          modeLabel={DAY_MODE_LABEL[mode]}
          afterGreeting={
            <>
              {isSunday && weather?.week && <WeekWeatherPanel week={weather.week} city={settings.city} />}
              {showWeeklyReview && <WeeklyReview review={weeklyReview} />}
              <InstallAppBanner />
              <OvernightDeltaBanner delta={overnightDelta} />
              {overcommitment && <OvercommitmentBanner warning={overcommitment} />}
              {showWindDown && <WindDownBanner bedtime={bedtime} />}
              {commuteError && settings.useLiveCommute && (
                <p className="text-sm text-amber-300/90 panel px-4 py-2">{commuteError}</p>
              )}

              {/* Operator console. Phones: ring + command only (status panels come later).
                  Desktop: status | core + command | ECS. */}
              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
                <div className="hidden xl:block space-y-4">{statusPanels}</div>
                <div className="flex flex-col items-center justify-center gap-4 py-2 xl:py-10">
                  <div className="w-full max-w-[200px] sm:max-w-[320px] xl:max-w-[420px]">
                    <CoreRing lines={coreLines} status={systemStatus} />
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
                <div className="hidden xl:block space-y-4">{ecsPanels}</div>
              </div>
            </>
          }
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
        {/* Phones/tablets: the console's status panels, after today's plan */}
        <div className="xl:hidden grid gap-4 md:grid-cols-2">
          <div className="space-y-4">{statusPanels}</div>
          <div className="space-y-4">{ecsPanels}</div>
        </div>

        {commuteLoading && settings.useLiveCommute && (
          <p className="text-xs text-alfred-mist">Updating live commute…</p>
        )}

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
