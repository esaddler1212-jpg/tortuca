import { useCallback, useEffect, useMemo, useState } from "react";
import { useNow } from "./hooks/useNow";
import { nextWakeDay } from "../shared/bedtime";
import { dayKey, localHour, weekdayOfDay, zonedDateTime } from "../shared/timezone";
import { applyDayMode, dayMode, DAY_MODE_LABEL, isVantageMode, resolveMode } from "../shared/dayMode";
import { useFocusChoice } from "./hooks/useFocusChoice";
import { useVoiceOutput } from "./hooks/useVoiceOutput";
import { buildDailyBrief, buildVantageBrief } from "./lib/spokenBrief";
import { usePlan } from "./hooks/usePlan";
import { SparkCard } from "./components/SparkCard";
import { HubPanel } from "./components/HubPanel";
import { PulsePanel } from "./components/PulsePanel";
import { InboxPanel } from "./components/InboxPanel";
import { usePulse } from "./hooks/usePulse";
import { ConversationCaptions } from "./components/ConversationPanel";
import { useConversation } from "./hooks/useConversation";
import { buildAskContext } from "./lib/askContext";
import { weatherLabel } from "./lib/weather";
import { pulseSummary } from "../shared/pulse";
import { issContext } from "../shared/skyText";
import { gymContext, inboxContext, memosContext, moneyContext, shoppingContext } from "../shared/irisContext";
import { useHub } from "./hooks/useHub";
import { DEFAULT_ROUTINE, gymDayFor, moneyMonth } from "../shared/hub";
import { PlanPanel } from "./components/PlanPanel";
import { BusinessResearcherPanel } from "./components/BusinessResearcherPanel";
import { ChannelsPanel } from "./components/ChannelsPanel";
import { useBusinessResearch } from "./hooks/useBusinessResearch";
import { useChannels } from "./hooks/useChannels";
import { channelsSummary } from "../shared/channels";
import { fetchUserData } from "./lib/userData";
import { EMPTY_HUB, type HubState } from "../shared/hub";
import type { ResearchArea } from "../shared/businessResearch";
import type { PlanTask, YearGoal } from "../shared/planData";
import { allGoals, allTasks, goalProgress, handoffQueue, isDone, monthTasks, planTasksDoneOn, sparkDone, todaySpark, weekFocus } from "../shared/plan";
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
import { HudCore, HudCoreCompact } from "./components/hud/HudCore";
import { UpNextPanel, UrgentLine } from "./components/hud/HudHome";
import { GlassModule, HudTabBar, MoreSheet, type TabBadge } from "./components/hud/HudNav";
import { hudGauges, type GaugeId } from "../shared/hudGauges";
import { SOLAR_PLANETS, type SolarPlanetId } from "../shared/solarPlanets";
import { FamilyPurposeDebriefBanner } from "./components/FamilyPurposeDebriefBanner";
import { WeekWeatherPanel } from "./components/hud/WeekWeatherPanel";
import {
  LogPanel,
  NetworkPanel,
  RoadmapPanel,
  VitalsPanel,
} from "./components/hud/HudPanels";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { solarPlanetContextForIris } from "../shared/solarPlanets";

export default function App() {
  const { settings, persist, updateCity, saving, error, setError } = useSettings();
  // Re-evaluates all time-of-day logic every minute and when the app is reopened.
  const now = useNow();
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(settings);
  const { todos, pending, done, add, toggle, setTodos } = useTodos();
  const { connected, accountEmail, connect, disconnect, connectionError } = useGoogleIntegration();
  const channelAgent = useChannels(accountEmail);
  const { allEvents, addLocalEvent } = useSchedule(connected);
  const { messages, unread, loading: emailsLoading, error: emailsError, refresh: refreshEmails } = useEmails(connected);
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
  const commute = useCommute(settings, connected);
  const effectiveMinutes = commute.effectiveMinutes;
  const { logs: fitnessLogs, logWorkout, loadRemote: loadFitness } = useFitness(settings);
  const { hub, update: updateHub } = useHub();
  const bizResearch = useBusinessResearch(settings.timezone);

  const runBusinessResearch = useCallback(
    async (query: string, area: ResearchArea, context?: string) => {
      const result = await bizResearch.research({ query, area, context });
      if (result) {
        try {
          const remote = (await fetchUserData())?.hub as HubState | undefined;
          if (remote?.updatedAt) {
            updateHub(() => ({ ...EMPTY_HUB, ...remote, links: { ...(remote.links ?? {}) } }));
          }
        } catch {
          /* offline — server still saved for next sync */
        }
      }
      return result;
    },
    [bizResearch, updateHub],
  );
  const { pulse, error: pulseError } = usePulse(settings.latitude, settings.longitude);
  const { items: shoppingItems, add: addShopping, togglePantry, remove: removeShopping, loadRemote: loadShopping } = useShoppingList();
  const { plan, toggleTask: togglePlanTask, addTask: addPlanTask, removeTask: removePlanTask, setGoals: setPlanGoals, setHandoff, setBudget, toggleSpark, shuffleSpark, noteSpark } = usePlan();

  const onDraftEmail = useCallback(
    (task: PlanTask, goal?: YearGoal) => {
      const subject = task.title;
      const body = [
        task.deliverable ? `Deliverable: ${task.deliverable}` : "",
        goal ? `Goal: ${goal.title}` : "",
        "",
        "(Edit recipient and body in Channel agents, then approve send.)",
      ]
        .filter(Boolean)
        .join("\n");
      channelAgent.addDraftForArea(task.area, "", subject, body);
    },
    [channelAgent],
  );

  const onResearchTask = useCallback(
    (task: PlanTask, goal?: YearGoal) => {
      const query = task.deliverable ? `${task.title} — ${task.deliverable}` : task.title;
      const context = goal ? `Year goal: ${goal.title}` : undefined;
      void runBusinessResearch(query, task.area, context).then((r) => {
        if (r) setHandoff(task.id, "review");
      });
    },
    [runBusinessResearch, setHandoff],
  );

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
        pulse: pulse
          ? [
              pulseSummary(pulse),
              issContext(pulse.iss, settings.timezone),
              pulse.ships ? `${pulse.ships.length} ships in the Bay (${pulse.ships.filter((x) => (x.speedKt ?? 0) >= 0.5).length} moving)` : "",
            ]
              .filter(Boolean)
              .join(". ")
          : undefined,
      }),
    [displayName, settings.timezone, now, woodhouse, goalLines, weather, allSchedule, plan, today, desk, pulse],
  );
  // "Brief me": Iris reads today's rundown (or the Vantage briefing in that mode).
  const briefText = () =>
    isVantageMode(mode)
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
  const briefMe = () => voiceOut.speak(briefText(), { force: true });

  // Sunday: plan the week (week-ahead weather under the greeting).
  const isSunday = weekdayOfDay(dayKey(settings.timezone, now)) === "Sun";

  const channelPendingCount = channelAgent.pending.length;
  // Pulse lives in Vitals now; Today shows a one-line heads-up only when it matters.
  const pulseUrgent = Boolean(pulse && (pulse.alerts.length || (pulse.air && pulse.air.aqi > 100) || pulse.fires.some((f) => f.miles <= 30)));

  // Badges for the bottom tab bar and the More sheet.
  const badges = useMemo<Partial<Record<SolarPlanetId, TabBadge>>>(
    () => ({
      today: { alert: urgentCount > 0, count: urgentCount || undefined },
      inbox: { alert: unread > 0, count: unread || undefined },
      vitals: { alert: pulseUrgent },
      channels: { alert: channelPendingCount > 0, count: channelPendingCount || undefined },
    }),
    [urgentCount, unread, pulseUrgent, channelPendingCount],
  );

  // The four gauges around Iris's core.
  const gauges = useMemo(() => {
    const month = today.slice(0, 7);
    const mTasks = monthTasks(plan, month);
    return hudGauges({
      todosPending: pending.length,
      todosDone: done.filter((t) => t.completedAt?.startsWith(today)).length,
      urgent: urgentCount,
      unread,
      temp: weather?.temperature,
      aqi: pulse?.air?.aqi,
      pulseUrgent,
      workouts: Object.values(fitnessStatus.weekCounts).reduce((a, b) => a + b, 0),
      workoutTarget: 3,
      monthDone: mTasks.filter((t) => isDone(plan, t)).length,
      monthTotal: mTasks.length,
      monthLabel: new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    });
  }, [today, plan, pending, done, urgentCount, unread, weather, pulse, pulseUrgent, fitnessStatus]);

  // One amber line under the core: what matters right now.
  const urgentItems = useMemo(() => {
    const fmt = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone, hour: "numeric", minute: "2-digit" }).format(d);
    const items: string[] = [];
    if (leaveBy) items.push(`Leave by ${fmt(leaveBy.leaveBy)}`);
    const soon = todayTimeline.find((e) => {
      const t = Date.parse(e.start);
      return t > now.getTime() && t - now.getTime() < 3 * 3_600_000;
    });
    if (soon) items.push(`${soon.title.slice(0, 28)} ${fmt(new Date(soon.start))}`);
    if (pulseUrgent && pulse) items.push(pulse.alerts[0]?.event ?? (pulse.air && pulse.air.aqi > 100 ? `AQI ${pulse.air.aqi}` : "Fire nearby"));
    return items.slice(0, 3);
  }, [leaveBy, todayTimeline, now, pulseUrgent, pulse, settings.timezone]);

  const [activePlanet, setActivePlanet] = useState<SolarPlanetId | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  /** Open a module (tab, corner readout, More, or Iris's open_planet). */
  const focusPlanet = useCallback((id: SolarPlanetId) => {
    setMoreOpen(false);
    setActivePlanet(id);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  }, []);
  const closeModule = useCallback(() => {
    setActivePlanet(null);
    window.scrollTo({ top: 0 });
  }, []);
  /** Tapping the open tab again closes it. */
  const onTab = useCallback((id: SolarPlanetId) => (activePlanet === id && !moreOpen ? closeModule() : focusPlanet(id)), [activePlanet, moreOpen, closeModule, focusPlanet]);

  const coreLines: [string, string] =
    systemStatus === "ok" ? ["IRIS", "ONLINE"] : systemStatus === "degraded" ? ["IRIS", "DEGRADED"] : ["IRIS", "OFFLINE"];

  // Talk to Iris: tap the core ring. Context is rebuilt fresh at each turn.
  const convo = useConversation({
    // On open: "Good morning, boss. Want to go over the brief, or …?"
    buildGreeting: () => {
      const h = localHour(settings.timezone, new Date());
      const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
      return isVantageMode(mode)
        ? `${hello}, boss. Want to go over your Vantage Point briefing, or did you have something else in mind?`
        : `${hello}, boss. Want to go over the brief, or did you have something else in mind?`;
    },
    // Her greeting already said hello, so the brief starts with the content.
    buildBrief: () => briefText().replace(/^Good (morning|afternoon|evening), boss\.\s*/, ""),
    timeZone: settings.timezone,
    today,
    onAddTodo: (title, dueDate) => add(title, dueDate),
    location: { lat: settings.latitude, lon: settings.longitude },
    // "Save this conversation?" → yes: the transcript becomes a memo.
    onSaveTranscript: (text) =>
      updateHub((h) => ({
        ...h,
        memos: [{ id: `memo-${Date.now().toString(36)}`, at: new Date().toISOString(), text: `Conversation with Iris\n${text}` }, ...h.memos].slice(0, 200),
      })),
    buildContext: () =>
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
                        pulse: pulse
                          ? [
                              pulseSummary(pulse),
                              issContext(pulse.iss, settings.timezone),
                              pulse.ships ? `${pulse.ships.length} ships in the Bay (${pulse.ships.filter((x) => (x.speedKt ?? 0) >= 0.5).length} moving)` : "",
                            ]
                              .filter(Boolean)
                              .join(". ")
                          : undefined,
                        goals: goalLines,
                        desk: { review: desk.review.length, working: desk.working.length },
                        channels: channelsSummary(channelAgent.channels),
                        solarPlanets: solarPlanetContextForIris(),
                        extras: (() => {
                          const tz = settings.timezone;
                          const schoolNames = [settings.schoolName].filter(Boolean) as string[];
                          const month = today.slice(0, 7);
                          const gym = gymDayFor(hub.routine ?? DEFAULT_ROUTINE, today);
                          return [
                            connected ? inboxContext(messages, tz, { schoolNames }) : "",
                            memosContext(hub.memos, tz, { schoolNames }),
                            moneyContext(
                              moneyMonth(hub.money, month),
                              new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }),
                              hub.revenueGoal,
                            ),
                            gymContext({
                              workoutsThisWeek: Object.values(fitnessStatus.weekCounts).reduce((a, b) => a + b, 0),
                              target: 3,
                              loggedToday: Boolean(fitnessStatus.loggedToday),
                              next: gym ? { title: gym.plan.title, day: gym.plan.weekday, isToday: gym.isToday } : null,
                            }),
                            shoppingContext(shoppingItems),
                          ].filter(Boolean);
                        })(),
                      }),
    onOpenPlanet: focusPlanet,
  });

  // Iris's ring: the centre of the HUD (tap to talk). Same ring in the full and compact core.
  const coreRing = (
    <CoreRing
      lines={coreLines}
      status={systemStatus}
      phase={convo.phase}
      replyTick={convo.replyTick}
      active={convo.active}
      waiting={convo.pendingGreeting}
      onActivate={convo.tap}
    />
  );

  const familyPurposeAppUrl =
    settings.familyPurposeNodeUrl?.trim() ||
    woodhouse?.nodes.find((n) => n.registryId === "family-purpose")?.baseUrl ||
    "";

  const ecsPanels = (
    <>
      <RoadmapPanel woodhouse={woodhouse} />
      <LogPanel timeline={todayTimeline} woodhouse={woodhouse} messages={messages} timeZone={settings.timezone} />
    </>
  );

  const renderPlanetModule = (id: SolarPlanetId) => {
    switch (id) {
      case "vitals":
        return (
          <>
            <VitalsPanel weather={weather} city={settings.city} fitness={fitnessStatus} />
            <PulsePanel
              pulse={pulse}
              error={pulseError}
              city={settings.city}
              lat={settings.latitude}
              lon={settings.longitude}
              timeZone={settings.timezone}
              defaultOpen
            />
            {isSunday && weather?.week && <WeekWeatherPanel week={weather.week} city={settings.city} />}
          </>
        );
      case "inbox":
        return (
          <InboxPanel
            messages={messages}
            unread={unread}
            loading={emailsLoading}
            error={emailsError}
            googleConnected={connected}
            timeZone={settings.timezone}
            onRefresh={() => void refreshEmails()}
            onConnectGoogle={() => void connect()}
            onAddTodo={(title) => add(title)}
          />
        );
      case "apps":
        return <NetworkPanel woodhouse={woodhouse} googleConnected={connected} />;
      case "today":
        return (
          <>
            <FamilyPurposeDebriefBanner
              mode={mode}
              timeZone={settings.timezone}
              woodhouse={woodhouse}
              familyPurposeAppUrl={familyPurposeAppUrl}
            />
            <TodayCommandCenter
              moduleOnly
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
                  {showWeeklyReview && <WeeklyReview review={weeklyReview} />}
                  <InstallAppBanner />
                  <OvernightDeltaBanner delta={overnightDelta} />
                  {overcommitment && <OvercommitmentBanner warning={overcommitment} />}
                  {showWindDown && <WindDownBanner bedtime={bedtime} />}
                </>
              }
              unreadEmails={unread}
              onOpenInbox={() => focusPlanet("inbox")}
              onOpenVitals={() => focusPlanet("vitals")}
              pulseAlert={pulseUrgent ? pulseSummary(pulse!) : undefined}
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
          </>
        );
      case "plan":
        return (
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
            onResearchTask={onResearchTask}
            onDraftEmail={onDraftEmail}
          />
        );
      case "research":
        return (
          <BusinessResearcherPanel
            googleConnected={connected}
            loading={bizResearch.loading}
            error={bizResearch.error}
            last={bizResearch.last}
            onConnectGoogle={() => void connect()}
            onResearch={(q, a) => runBusinessResearch(q, a)}
          />
        );
      case "hub":
        return (
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
        );
      case "meal":
        return (
          <MealPrepPanel
            settings={settings}
            items={shoppingItems}
            onAdd={addShopping}
            onToggle={togglePantry}
            onRemove={removeShopping}
          />
        );
      case "ecs":
        return ecsPanels;
      case "channels":
        return (
          <ChannelsPanel
            state={channelAgent.channels}
            pending={channelAgent.pending}
            googleConnected={connected}
            accountEmail={accountEmail}
            onSaveChannel={channelAgent.saveChannel}
            onAddDraft={channelAgent.addDraft}
            onDiscardDraft={channelAgent.discardDraft}
            onSendDraft={channelAgent.sendDraft}
            onConnectGoogle={() => void connect()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] safe-bottom relative">
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

      <main className={`mx-auto px-4 py-4 space-y-4 hud-with-tabbar ${activePlanet ? "max-w-[1100px]" : "max-w-[560px]"}`}>
        {activePlanet ? (
          <>
            <HudCoreCompact
              core={coreRing}
              readout={gauges.find((g) => g.id === (activePlanet as GaugeId))?.value ?? (SOLAR_PLANETS.find((p) => p.id === activePlanet)?.label ?? "").toUpperCase()}
              alert={badges[activePlanet]?.alert}
            />
            <ConversationCaptions convo={convo} googleConnected={connected} />
            <GlassModule key={activePlanet} id={activePlanet} onClose={closeModule}>
              {renderPlanetModule(activePlanet)}
            </GlassModule>
          </>
        ) : (
          <>
            <HudCore gauges={gauges} core={coreRing} onOpen={(id) => focusPlanet(id)} />
            <ConversationCaptions convo={convo} googleConnected={connected} />
            <UrgentLine items={urgentItems} />
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
            <UpNextPanel
              todos={pending}
              onToggle={toggle}
              spark={todaySpark(plan, today)}
              sparkDone={sparkDone(plan, today)}
              onOpenToday={() => focusPlanet("today")}
            />
            <FamilyPurposeDebriefBanner
              mode={mode}
              timeZone={settings.timezone}
              woodhouse={woodhouse}
              familyPurposeAppUrl={familyPurposeAppUrl}
            />
          </>
        )}
      </main>

      <MoreSheet open={moreOpen} badges={badges} onPick={focusPlanet} onClose={() => setMoreOpen(false)} />
      <HudTabBar active={activePlanet} moreOpen={moreOpen} badges={badges} onTab={onTab} onMore={() => setMoreOpen((o) => !o)} />

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
        commuteStatus={
          !settings.useLiveCommute
            ? "Live traffic is off. Leave-by uses your usual minutes."
            : commute.configured === false
              ? "Live traffic needs GOOGLE_MAPS_API_KEY in Netlify. Until then, leave-by uses your usual minutes."
              : commute.hasAddresses === false
                ? "Add both addresses and save, and the server will check traffic on school mornings."
                : commute.live
                  ? `Last live check: ${commute.live.minutes} min at ${new Date(commute.live.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: settings.timezone })}${commute.usingLive ? " (in use now)" : ""}. Checked every 15 min on school mornings.`
                  : "The server checks traffic every 15 minutes on school mornings."
        }
        onRefreshCommute={() => void commute.refresh()}
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
