import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import type { Tab } from "./appTabs";
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
import { ConnectivityBannerLive } from "./ConnectivityBanner";
import { useScheduledBackup } from "./useAutoBackup";
import AppNav from "./AppNav";
import { DeviceSyncHint } from "./DeviceSync";

const FollowUpTab = lazy(() => import("./FollowUpTab"));
const GroupTab = lazy(() => import("./GroupTab"));
const DebriefTab = lazy(() => import("./DebriefTab"));
const ReportsTab = lazy(() => import("./ReportsTab"));
const ImpactTab = lazy(() => import("./ImpactTab"));
const SettingsTab = lazy(() => import("./SettingsTab"));

function TabLoading() {
  return (
    <div className="card loading-card" role="status">
      <span className="spinner" aria-hidden="true" />
      Loading…
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("log");
  const [moreOpen, setMoreOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [settings, setSettings] = useState<DebriefSettings>(() =>
    loadDebriefSettings(),
  );
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const refreshData = useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  useScheduledBackup(settings, showToast, refreshData);

  const onChanged = useCallback(
    (message?: string) => {
      refreshData();
      if (message) showToast(message);
    },
    [refreshData, showToast],
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

  const outstanding = useMemo(() => {
    const queue = buildFollowUpQueue(history);
    return queue.overdue.length + queue.dueToday.length;
  }, [history]);
  const awaitingOutcome = useMemo(() => needsOutcome(history).length, [history]);
  const followUpBadge = outstanding + awaitingOutcome;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">FP</div>
          <div>
            <h1>Family Purpose</h1>
            <p>
              {getTodayDateLabel()} · {todayCheckIns.length} check-in
              {todayCheckIns.length === 1 ? "" : "s"} today
            </p>
          </div>
        </div>
        <DeviceSyncHint settings={settings} />
      </header>

      <ConnectivityBannerLive />

      <div className="app-layout">
        <AppNav
          tab={tab}
          followUpBadge={followUpBadge}
          onSelect={setTab}
          moreOpen={moreOpen}
          onMoreToggle={setMoreOpen}
        />

        <main className="app-main" id="main-content">
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
                onSynced={() => onChanged()}
              />
            )}
          </Suspense>
        </main>
      </div>

      <p className="mobile-install-hint">
        On your phone: open this site in Chrome → menu → <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
      </p>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
