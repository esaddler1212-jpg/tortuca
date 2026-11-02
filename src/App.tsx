import { useEffect, useMemo } from "react";
import { useNow } from "./hooks/useNow";
import { nextWakeDay } from "../shared/bedtime";
import { dayKey, weekdayOfDay, zonedDateTime } from "../shared/timezone";
import { applyDayMode, dayMode, DAY_MODE_LABEL, isVantageMode, resolveMode } from "../shared/dayMode";
import { useFocusChoice } from "./hooks/useFocusChoice";
import { useVoiceOutput } from "./hooks/useVoiceOutput";
import { buildDailyBrief, buildVantageBrief } from "./lib/spokenBrief";
import { usePlan } from "./hooks/usePlan";
import { SparkCard } from "./components/SparkCard";
import { HubPanel } from "./components/HubPanel";
import { PulsePanel } from "./components/PulsePanel";
import { usePulse } from "./hooks/usePulse";
import { ConversationPanel } from "./components/ConversationPanel";
import { buildAskContext } from "./lib/askContext";
import { weatherLabel } from "./lib/weather";
import { pulseSummary } from "../shared/pulse";
import { useHub } from "./hooks/useHub";
import { DEFAULT_ROUTINE, gymDayFor } from "../shared/hub";
import { PlanPanel } from "./components/PlanPanel";
import { allGoals, allTasks, goalProgress, handoffQueue, planTasksDoneOn, todaySpark, weekFocus } from "../shared/plan";
import { VantageBriefingPanel } from "./components/hud/VantageBriefingPanel";
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
import { HudHeader, type SystemStatus } from "./components/hud/HudHeader";
import { CoreRing } from "./components/hud/CoreRing";
import { WeekWeatherPanel } from "./components/hud/WeekWeatherPanel";
import {
  LogPanel,
  NetworkPanel,
  RoadmapPanel,
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
  // Clock picks the mode; the header's Focus menu can override it until the next switch.
  const autoMode = dayMode(settings.timezone, now);
  const focus = useFocusChoice(autoMode);
  const mode = resolveMode(autoMode, focus.choice);
  const woodhouse = useMemo(() => applyDayMode(rawWoodhouse, mode), [rawWoodhouse, mode]);

  // Theme follows the focus: blue school hours, green ECS Network, purple weekends.
  useEffect(() => {
    document.documentElement.dataset.focus = mode;
    const themeColor = { school: "#22d3ee", network: "#4ade80", weekend: "#c084fc", holiday: "#c084fc", vantage: "#c084fc" }[mode];
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  }, [mode]);
  const { snapshot: stocks, loading: stocksLoading } = useStocks();
  const { effectiveMinutes, loading: commuteLoading, error: commuteError } = useCommute(settings);
  const { logs: fitnessLogs, logWorkout, loadRemote: loadFitness } = useFitness(settings);
  const { hub, update: updateHub } = useHub();
  const { pulse, error: pulseError } = usePulse(settings.latitude, settings.longitude);
  const { items: shoppingItems, add: addShopping, togglePantry, remove: removeShopping, loadRemote: loadShopping } = useShoppingList();
  const { plan, toggleTask: togglePlanTask, addTask: addPlanTask, removeTask: removePlanTask, setGoals: setPlanGoals, setHandoff, setBudget, toggleSpark, shuffleSpark, noteSpark } = usePlan();

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

  const today = dayKey(settings.timezone, now);
  const planTaskMap = useMemo(() => new Map(allTasks(plan).map((t) => [t.id, t])), [plan]);
  const planGoalMap = useMemo(() => new Map(allGoals(plan).map((g) => [g.id, g])), [plan]);
  // Do today = urgent app items, then up to 2 plan tasks for the current focus, then the rest.
  // Hand-offs waiting on your OK come first; tasks already with Claude stay off the list.
  const desk = useMemo(() => handoffQueue(plan), [plan]);
  const todayPlanTasks = useMemo(
    () =>
      mode === "school"
        ? []
        : [...desk.review, ...weekFocus(plan, today, mode, 12).filter((t) => !plan.handoffs[t.id]).slice(0, 2)],
    [plan, today, mode, desk],
  );
  const todayActions = useMemo(() => {
    const queue = buildTodayQueue(pending, woodhouse);
    const planItems = todayPlanTasks.map((t) => ({
      id: `plan-${t.id}`,
      title: plan.handoffs[t.id]?.status === "review" ? `Review Claude's work: ${t.title}` : t.title,
      source: "plan" as const,
      sourceLabel: plan.handoffs[t.id] ? `Agent desk · ${t.area}` : `Plan · ${t.area}`,
      urgent: false,
      sort: 0.5,
      planTaskId: t.id,
    }));
    return [...queue.filter((a) => a.urgent), ...planItems, ...queue.filter((a) => !a.urgent)];
  }, [pending, woodhouse, todayPlanTasks, plan.handoffs]);
  // "$BAY Season 1: 4/34" lines for the current year's goals (Vantage briefing, weekly review).
  const goalLines = useMemo(() => {
    const year = Number(today.slice(0, 4));
    return allGoals(plan)
      .filter((g) => g.year === year)
      .map((g) => {
        const p = goalProgress(plan, g.id);
        return p.total ? `${g.title}: ${p.done} of ${p.total} done` : g.title;
      });
  }, [plan, today]);

  const planDoneToday = useMemo(() => planTasksDoneOn(plan, today, settings.timezone), [plan, today, settings.timezone]);

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
    () => buildWeeklyReview(settings, pending, done, allSchedule, woodhouse, shoppingItems, goalLines),
    [settings, pending, done, allSchedule, woodhouse, shoppingItems, goalLines],
  );
  const showWeeklyReview = isWeeklyReviewTime(settings, now);

  const displayName = settings.preferredName?.trim() || accountEmail?.split("@")[0];

  const systemStatus: SystemStatus = useMemo(() => {
    if (woodhouseError && !woodhouse) return "offline";
    const nodes = woodhouse?.nodes ?? [];
    if (!nodes.length) return woodhouseLoading ? "ok" : "offline";
    return nodes.every((n) => n.ok) ? "ok" : "degraded";
  }, [woodhouse, woodhouseError, woodhouseLoading]);



  const voiceOut = useVoiceOutput();
  const vantage = useMemo(
    () =>
      buildVantageBrief({
        name: displayName,
        tz: settings.timezone,
        now,
        woodhouse,
        goals: goalLines,
        weather,
        events: allSchedule,
        spark: todaySpark(plan, today),
        desk: { review: desk.review.length, working: desk.working.length },
        pulse: pulse ? pulseSummary(pulse) : undefined,
      }),
    [displayName, settings.timezone, now, woodhouse, goalLines, weather, allSchedule, plan, today, desk, pulse],
  );
  // "Brief me": Alfred reads today's rundown (or the Vantage briefing in that mode).
  const briefMe = () => {
    const text = isVantageMode(mode)
      ? vantage.spoken
      : buildDailyBrief({
          name: displayName,
          tz: settings.timezone,
          now,
          mode,
          city: settings.city,
          weather,
          leaveBy,
          actions: todayActions,
          events: allSchedule,
          spark: todaySpark(plan, today),
          pulse:
            pulse && (pulse.alerts.length || (pulse.air && pulse.air.aqi > 100) || pulse.fires.some((f) => f.miles <= 30))
              ? pulseSummary(pulse)
              : undefined,
          gym: (() => {
            const g = gymDayFor(hub.routine ?? DEFAULT_ROUTINE, today);
            return g?.isToday ? g.plan.title : undefined;
          })(),
        });
    voiceOut.speak(text, { force: true });
  };

  // Sunday: plan the week (week-ahead weather under the greeting).
  const isSunday = weekdayOfDay(dayKey(settings.timezone, now)) === "Sun";

  const coreLines: [string, string] =
    systemStatus === "ok" ? ["ALFRED", "ONLINE"] : systemStatus === "degraded" ? ["ALFRED", "DEGRADED"] : ["ALFRED", "OFFLINE"];

  const statusPanels = (
    <>
      <VitalsPanel weather={weather} city={settings.city} fitness={fitnessStatus} />
      <NetworkPanel woodhouse={woodhouse} googleConnected={connected} />
    </>
  );

  const ecsPanels = (
    <>
      <RoadmapPanel woodhouse={woodhouse} />
      <LogPanel timeline={todayTimeline} woodhouse={woodhouse} messages={messages} timeZone={settings.timezone} />
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
        focusChoice={focus.choice}
        onFocusChoice={focus.choose}
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
          onBriefMe={voiceOut.supported ? briefMe : undefined}
          briefSpeaking={voiceOut.speaking}
          onStopBrief={voiceOut.stop}
          afterGreeting={
            <>
              <SparkCard plan={plan} today={today} onToggle={toggleSpark} onShuffle={shuffleSpark} onNote={noteSpark} />
              {isVantageMode(mode) && <VantageBriefingPanel lines={vantage.lines} spoken={vantage.spoken} />}
              <PulsePanel key={`pulse-${isVantageMode(mode)}`} pulse={pulse} error={pulseError} city={settings.city} defaultOpen={isVantageMode(mode)} />
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
                  <ConversationPanel
                    googleConnected={connected}
                    timeZone={settings.timezone}
                    today={today}
                    onAddTodo={(title, dueDate) => add(title, dueDate)}
                    buildContext={() =>
                      buildAskContext({
                        name: displayName,
                        now: new Date(),
                        timeZone: settings.timezone,
                        modeLabel: DAY_MODE_LABEL[mode],
                        city: settings.city,
                        weather: weather
                          ? `${Math.round(weather.temperature)}°F, ${weatherLabel(weather.weatherCode).toLowerCase()}, high ${Math.round(weather.high)}°F`
                          : null,
                        leaveBy: leaveBy
                          ? `${new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone, hour: "numeric", minute: "2-digit" }).format(leaveBy.leaveBy)} for ${leaveBy.destination}`
                          : null,
                        actions: todayActions,
                        events: allSchedule,
                        spark: todaySpark(plan, today),
                        pulse: pulse ? pulseSummary(pulse) : undefined,
                        goals: goalLines,
                        desk: { review: desk.review.length, working: desk.working.length },
                      })
                    }
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
          doneTodos={done}
          now={now}
          planTasks={planTaskMap}
          planGoals={planGoalMap}
          onTogglePlanTask={togglePlanTask}
          planDoneToday={planDoneToday}
        />
        <PlanPanel
          key={isVantageMode(mode) ? "plan-year" : "plan-week"}
          initialTab={isVantageMode(mode) ? "year" : "week"}
          plan={plan}
          today={today}
          mode={mode}
          timeZone={settings.timezone}
          now={now}
          events={allSchedule}
          onTodayIds={new Set(todayPlanTasks.map((t) => t.id))}
          onToggleTask={togglePlanTask}
          onAddTask={addPlanTask}
          onRemoveTask={removePlanTask}
          onSetGoals={setPlanGoals}
          onSetHandoff={setHandoff}
          onSetBudget={setBudget}
        />

        <HubPanel
          key={`hub-${mode}`}
          hub={hub}
          update={updateHub}
          today={today}
          mode={mode}
          timeZone={settings.timezone}
          googleConnected={connected}
          onAddTodo={(title) => add(title)}
          onLogWorkout={logWorkout}
          workoutLoggedToday={fitnessLogs.some((l) => l.date === today)}
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
