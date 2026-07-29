import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import type { DebriefSettings } from "./types";
import {
  getOrCreateSession,
  getTodayDateLabel,
  loadAllCheckIns,
  loadDebriefSettings,
  loadGroupMembers,
  loadGroupSessions,
  loadTodayCheckIns,
  todayKey,
} from "./storage";
import { buildRecentPeriods, buildRoster, orderReasonsByUse } from "./roster";
import LogTab from "./LogTab";
import { buildFollowUpQueue, needsOutcome } from "./followups";

const FollowUpTab = lazy(() => import("./FollowUpTab"));
const GroupTab = lazy(() => import("./GroupTab"));
const DebriefTab = lazy(() => import("./DebriefTab"));
const ReportsTab = lazy(() => import("./ReportsTab"));
const ImpactTab = lazy(() => import("./ImpactTab"));
const SettingsTab = lazy(() => import("./SettingsTab"));

function TabLoading() {
  return (
    <div className="card hint" role="status">
      Loading…
    </div>
  );
}

type Tab =
  | "log"
  | "followup"
  | "group"
  | "debrief"
  | "reports"
  | "impact"
  | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "log", label: "Log" },
  { id: "followup", label: "Follow-up" },
  { id: "group", label: "Group" },
  { id: "debrief", label: "Debrief" },
  { id: "reports", label: "Reports" },
  { id: "impact", label: "Impact" },
  { id: "settings", label: "Settings" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("log");
  const [revision, setRevision] = useState(0);
  const [settings, setSettings] = useState<DebriefSettings>(() =>
    loadDebriefSettings(),
  );
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  /** Bumped whenever stored data changes so the derived views recompute. */
  const onChanged = useCallback(
    (message?: string) => {
      setRevision((r) => r + 1);
      if (message) showToast(message);
    },
    [showToast],
  );

  const history = useMemo(() => loadAllCheckIns(), [revision]);
  const todayCheckIns = useMemo(() => loadTodayCheckIns(), [revision]);
  const sessions = useMemo(() => loadGroupSessions(), [revision]);
  const members = useMemo(() => loadGroupMembers(), [revision]);
  const todaySession = useMemo(
    () => getOrCreateSession(todayKey()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions],
  );

  const roster = useMemo(() => buildRoster(history), [history]);
  const recentPeriods = useMemo(() => buildRecentPeriods(history), [history]);
  const reasonOrder = useMemo(() => orderReasonsByUse(history), [history]);

  /** Anything owed: shown on the tab so it is visible without going looking. */
  const outstanding = useMemo(() => {
    const queue = buildFollowUpQueue(history);
    return queue.overdue.length + queue.dueToday.length;
  }, [history]);
  const awaitingOutcome = useMemo(() => needsOutcome(history).length, [history]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Family Purpose</h1>
        <p>{getTodayDateLabel()} — student check-in log</p>
      </header>

      <nav className="tabs" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "followup" && outstanding + awaitingOutcome > 0 && (
              <span className="tab-badge">{outstanding + awaitingOutcome}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === "log" && (
        <LogTab
          roster={roster}
          recentPeriods={recentPeriods}
          reasonOrder={reasonOrder}
          todayCheckIns={todayCheckIns}
          onChanged={onChanged}
        />
      )}

      <Suspense fallback={<TabLoading />}>
        {tab === "followup" && (
          <FollowUpTab checkIns={history} onChanged={onChanged} />
        )}

        {tab === "group" && (
          <GroupTab
            settings={settings}
            members={members}
            sessions={sessions}
            roster={roster}
            onChanged={onChanged}
          />
        )}

        {tab === "debrief" && (
          <DebriefTab
            checkIns={todayCheckIns}
            allCheckIns={history}
            sessions={sessions}
            session={todaySession}
            settings={settings}
            onCopied={() => showToast("Debrief copied")}
            onPdfDownloaded={() => showToast("PDF downloaded")}
          />
        )}

        {tab === "reports" && (
          <ReportsTab
            checkIns={history}
            sessions={sessions}
            settings={settings}
            onCopied={() => showToast("Summary copied")}
            onPdfDownloaded={() => showToast("PDF downloaded")}
          />
        )}

        {tab === "impact" && (
          <ImpactTab
            checkIns={history}
            sessions={sessions}
            settings={settings}
            onCopied={() => showToast("Impact summary copied")}
            onPdfDownloaded={() => showToast("PDF downloaded")}
          />
        )}

        {tab === "settings" && (
          <SettingsTab
            settings={settings}
            onSave={(s) => {
              setSettings(s);
              showToast("Settings saved");
            }}
            onRestored={() => {
              setSettings(loadDebriefSettings());
              onChanged("Backup restored");
            }}
          />
        )}
      </Suspense>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
