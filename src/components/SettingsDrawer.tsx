import { useState, useEffect } from "react";
import { VoicePicker } from "./VoicePicker";
import { IrisMemoryPanel } from "./IrisMemoryPanel";
import { IrisUsagePanel } from "./IrisUsagePanel";
import { X } from "lucide-react";
import { OPEN_SETTINGS_EVENT } from "../lib/settingsEvents";
import type { UserSettings } from "../types";
import type { WoodhouseRegistryEntry } from "../types/woodhouse";
import { WoodhouseNodesEditor } from "./WoodhouseNodesEditor";

interface PushState {
  subscribed: boolean;
  error: string | null;
  loading: boolean;
  enable: () => Promise<boolean>;
}

interface Props {
  settings: UserSettings;
  googleConnected: boolean;
  accountEmail?: string;
  googleConnectionError?: string | null;
  push: PushState;
  onSaveCity: (city: string) => Promise<boolean>;
  onSaveWoodhouseNodes: (nodes: WoodhouseRegistryEntry[]) => void;
  /** Plain-language live-traffic status (server-side commute). */
  commuteStatus?: string;
  onRefreshCommute?: () => void;
  onSaveCommute: (
    patch: Partial<
      Pick<
        UserSettings,
        | "preferredName"
        | "commuteMinutes"
        | "arriveBufferMinutes"
        | "schoolStartTime"
        | "schoolName"
        | "schoolGrade"
        | "eveningWrapHour"
        | "weeklyReviewHour"
        | "homeAddress"
        | "schoolAddress"
        | "useLiveCommute"
        | "briefingHour"
        | "wakeTime"
        | "morningWorkoutDeadlineHour"
        | "fitnessSuggestTime"
        | "targetSleepHours"
        | "windDownMinutes"
        | "morningRoutineMinutes"
        | "weekendWakeTime"
      >
    >,
  ) => void;
  onSaveNotifications: (
    patch: Partial<Pick<UserSettings, "morningDigestEnabled" | "pushNotificationsEnabled" | "briefingHour">>,
  ) => Promise<void>;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  saving: boolean;
  error: string | null;
}

export function SettingsDrawer({
  settings,
  googleConnected,
  accountEmail,
  googleConnectionError,
  push,
  onSaveCity,
  onSaveWoodhouseNodes,
  commuteStatus,
  onRefreshCommute,
  onSaveCommute,
  onSaveNotifications,
  onConnectGoogle,
  onDisconnectGoogle,
  saving,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [preferredName, setPreferredName] = useState(settings.preferredName);
  const [city, setCity] = useState(settings.city);
  const [nodes, setNodes] = useState(settings.woodhouseNodes);
  const [commute, setCommute] = useState(String(settings.commuteMinutes));
  const [buffer, setBuffer] = useState(String(settings.arriveBufferMinutes));
  const [schoolStart, setSchoolStart] = useState(settings.schoolStartTime);
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolGrade, setSchoolGrade] = useState(settings.schoolGrade);
  const [eveningHour, setEveningHour] = useState(String(settings.eveningWrapHour));
  const [weeklyHour, setWeeklyHour] = useState(String(settings.weeklyReviewHour));
  const [homeAddress, setHomeAddress] = useState(settings.homeAddress);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [useLiveCommute, setUseLiveCommute] = useState(settings.useLiveCommute);
  const [briefingHour, setBriefingHour] = useState(String(settings.briefingHour));
  const [morningDigest, setMorningDigest] = useState(settings.morningDigestEnabled);
  const [pushEnabled, setPushEnabled] = useState(settings.pushNotificationsEnabled);
  const [wakeTime, setWakeTime] = useState(settings.wakeTime);
  const [workoutDeadline, setWorkoutDeadline] = useState(String(settings.morningWorkoutDeadlineHour));
  const [fitnessTime, setFitnessTime] = useState(settings.fitnessSuggestTime);
  const [targetSleep, setTargetSleep] = useState(String(settings.targetSleepHours));
  const [windDown, setWindDown] = useState(String(settings.windDownMinutes));
  const [morningRoutine, setMorningRoutine] = useState(String(settings.morningRoutineMinutes));
  const [weekendWake, setWeekendWake] = useState(settings.weekendWakeTime);

  useEffect(() => {
    setPreferredName(settings.preferredName);
    setCity(settings.city);
    setNodes(settings.woodhouseNodes);
    setCommute(String(settings.commuteMinutes));
    setBuffer(String(settings.arriveBufferMinutes));
    setSchoolStart(settings.schoolStartTime);
    setSchoolName(settings.schoolName);
    setSchoolGrade(settings.schoolGrade);
    setEveningHour(String(settings.eveningWrapHour));
    setWeeklyHour(String(settings.weeklyReviewHour));
    setHomeAddress(settings.homeAddress);
    setSchoolAddress(settings.schoolAddress);
    setUseLiveCommute(settings.useLiveCommute);
    setBriefingHour(String(settings.briefingHour));
    setMorningDigest(settings.morningDigestEnabled);
    setPushEnabled(settings.pushNotificationsEnabled);
    setWakeTime(settings.wakeTime);
    setWorkoutDeadline(String(settings.morningWorkoutDeadlineHour));
    setFitnessTime(settings.fitnessSuggestTime);
    setTargetSleep(String(settings.targetSleepHours));
    setWindDown(String(settings.windDownMinutes));
    setMorningRoutine(String(settings.morningRoutineMinutes));
    setWeekendWake(settings.weekendWakeTime);
  }, [settings]);

  // The header's gear button opens the drawer (see lib/settingsEvents).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const save = async () => {
    const ok = await onSaveCity(city);
    if (ok) setOpen(false);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[48] flex justify-end bg-black/50"
          role="dialog"
          aria-modal
          aria-labelledby="settings-drawer-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel h-full w-full max-w-md p-6 overflow-y-auto border-l border-alfred-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="settings-drawer-title" className="font-display text-2xl text-alfred-gold">
                Preferences
              </h2>
              <button type="button" className="btn-ghost p-2" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-alfred-mist mb-2" htmlFor="preferred-name">
                  Your name (shown in your greeting; Iris calls you boss)
                </label>
                <div className="flex gap-2">
                  <input
                    id="preferred-name"
                    className="input-field flex-1"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-gold"
                    onClick={() => onSaveCommute({ preferredName: preferredName.trim() || "E" })}
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <label className="block text-sm text-alfred-mist mb-2" htmlFor="city">
                  Location (weather &amp; sunset)
                </label>
                <input
                  id="city"
                  className="input-field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                {error && <p className="text-sm text-red-300/90 mt-2">{error}</p>}
                <button
                  type="button"
                  className="btn-gold mt-3 w-full"
                  disabled={saving}
                  onClick={() => void save()}
                >
                  {saving ? "Saving…" : "Save location"}
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Leave-by time</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  Iris calculates when to leave for school or your first calendar event.
                </p>
                <div className="space-y-2">
                  <label className="text-xs text-alfred-mist" htmlFor="school-name">School name</label>
                  <input id="school-name" className="input-field" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  <label className="text-xs text-alfred-mist" htmlFor="school-grade">Student grade</label>
                  <select
                    id="school-grade"
                    className="input-field"
                    value={schoolGrade}
                    onChange={(e) => setSchoolGrade(e.target.value as "6" | "78")}
                  >
                    <option value="6">6th grade</option>
                    <option value="78">7th / 8th grade</option>
                  </select>
                  <label className="text-xs text-alfred-mist" htmlFor="school-start">First bell override (HH:MM)</label>
                  <input id="school-start" className="input-field" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} placeholder="08:00" />
                  <p className="text-xs text-alfred-mist/70">
                    Bell schedule auto-detects Wednesday early release and minimum days from Family Purpose.
                  </p>
                  <label className="text-xs text-alfred-mist" htmlFor="commute">Usual commute (minutes)</label>
                  <input id="commute" type="number" min={1} className="input-field" value={commute} onChange={(e) => setCommute(e.target.value)} />
                  <label className="text-xs text-alfred-mist" htmlFor="home-address">Home address</label>
                  <input id="home-address" className="input-field" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="Your home address" />
                  <label className="text-xs text-alfred-mist" htmlFor="school-address">School / destination address</label>
                  <input id="school-address" className="input-field" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder="School or work address" />
                  <label className="flex min-h-[44px] items-center gap-2 text-sm text-alfred-mist mt-2">
                    <input type="checkbox" checked={useLiveCommute} onChange={(e) => setUseLiveCommute(e.target.checked)} />
                    Use live traffic (the server checks it on school mornings)
                  </label>
                  {commuteStatus && (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-alfred-mist/80">{commuteStatus}</p>
                      {onRefreshCommute && googleConnected && useLiveCommute && (
                        <button type="button" className="btn-ghost min-h-[40px] shrink-0 px-3 text-xs" onClick={onRefreshCommute}>
                          Check now
                        </button>
                      )}
                    </div>
                  )}
                  <label className="text-xs text-alfred-mist" htmlFor="buffer">Arrival buffer (minutes)</label>
                  <input id="buffer" type="number" min={0} className="input-field" value={buffer} onChange={(e) => setBuffer(e.target.value)} />
                </div>
                <button
                  type="button"
                  className="btn-gold mt-3 w-full"
                  onClick={() =>
                    onSaveCommute({
                      schoolName: schoolName.trim(),
                      schoolStartTime: schoolStart.trim() || "08:00",
                      schoolGrade,
                      commuteMinutes: Math.max(1, Number(commute) || 25),
                      arriveBufferMinutes: Math.max(0, Number(buffer) || 5),
                      homeAddress: homeAddress.trim(),
                      schoolAddress: schoolAddress.trim(),
                      useLiveCommute,
                    })
                  }
                >
                  Save leave-by settings
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Wake &amp; training</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  Weekday alarm 4:15 AM — Iris prompts for arms, body, legs, or cardio, then suggests a slot if you skip the morning.
                </p>
                <label className="text-xs text-alfred-mist" htmlFor="wake-time">Wake time (HH:MM)</label>
                <input id="wake-time" className="input-field mb-2" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} placeholder="04:15" />
                <label className="text-xs text-alfred-mist" htmlFor="workout-deadline">Morning workout deadline (hour)</label>
                <input id="workout-deadline" type="number" min={5} max={12} className="input-field mb-2" value={workoutDeadline} onChange={(e) => setWorkoutDeadline(e.target.value)} />
                <label className="text-xs text-alfred-mist" htmlFor="fitness-time">Afternoon fallback (HH:MM)</label>
                <input id="fitness-time" className="input-field mb-2" value={fitnessTime} onChange={(e) => setFitnessTime(e.target.value)} placeholder="17:00" />
                <button
                  type="button"
                  className="btn-gold w-full"
                  onClick={() =>
                    onSaveCommute({
                      wakeTime: wakeTime.trim() || "04:15",
                      morningWorkoutDeadlineHour: Math.min(12, Math.max(5, Number(workoutDeadline) || 9)),
                      fitnessSuggestTime: fitnessTime.trim() || "17:00",
                    })
                  }
                >
                  Save training schedule
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Sleep &amp; bedtime</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  Iris suggests lights-out from tomorrow&apos;s schedule, your wake alarm, and target sleep hours.
                </p>
                <label className="text-xs text-alfred-mist" htmlFor="target-sleep">Target sleep (hours)</label>
                <input
                  id="target-sleep"
                  type="number"
                  min={5}
                  max={10}
                  step={0.5}
                  className="input-field mb-2"
                  value={targetSleep}
                  onChange={(e) => setTargetSleep(e.target.value)}
                />
                <label className="text-xs text-alfred-mist" htmlFor="wind-down">Wind-down buffer (minutes)</label>
                <input
                  id="wind-down"
                  type="number"
                  min={10}
                  max={90}
                  className="input-field mb-2"
                  value={windDown}
                  onChange={(e) => setWindDown(e.target.value)}
                />
                <label className="text-xs text-alfred-mist" htmlFor="morning-routine">Morning routine before leave (minutes)</label>
                <input
                  id="morning-routine"
                  type="number"
                  min={15}
                  max={120}
                  className="input-field mb-2"
                  value={morningRoutine}
                  onChange={(e) => setMorningRoutine(e.target.value)}
                />
                <label className="text-xs text-alfred-mist" htmlFor="weekend-wake">Weekend wake (HH:MM, open mornings)</label>
                <input
                  id="weekend-wake"
                  className="input-field mb-2"
                  value={weekendWake}
                  onChange={(e) => setWeekendWake(e.target.value)}
                  placeholder="08:00"
                />
                <button
                  type="button"
                  className="btn-gold w-full"
                  onClick={() =>
                    onSaveCommute({
                      targetSleepHours: Math.min(10, Math.max(5, Number(targetSleep) || 7.5)),
                      windDownMinutes: Math.min(90, Math.max(10, Number(windDown) || 30)),
                      morningRoutineMinutes: Math.min(120, Math.max(15, Number(morningRoutine) || 45)),
                      weekendWakeTime: weekendWake.trim() || "08:00",
                    })
                  }
                >
                  Save sleep settings
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Evening wrap</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  After this hour, Iris shows your day summary and tomorrow preview.
                </p>
                <label className="text-xs text-alfred-mist" htmlFor="evening-hour">Start hour (0–23)</label>
                <input
                  id="evening-hour"
                  type="number"
                  min={12}
                  max={22}
                  className="input-field"
                  value={eveningHour}
                  onChange={(e) => setEveningHour(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-gold mt-3 w-full"
                  onClick={() =>
                    onSaveCommute({
                      eveningWrapHour: Math.min(22, Math.max(12, Number(eveningHour) || 17)),
                    })
                  }
                >
                  Save evening wrap
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Weekly review</h3>
                <p className="text-sm text-alfred-mist mb-3">Sunday summary: tasks, school schedule, Woodhouse apps.</p>
                <label className="text-xs text-alfred-mist" htmlFor="weekly-hour">Sunday start hour (0–23)</label>
                <input
                  id="weekly-hour"
                  type="number"
                  min={12}
                  max={22}
                  className="input-field"
                  value={weeklyHour}
                  onChange={(e) => setWeeklyHour(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-gold mt-3 w-full"
                  onClick={() =>
                    onSaveCommute({
                      weeklyReviewHour: Math.min(22, Math.max(12, Number(weeklyHour) || 18)),
                    })
                  }
                >
                  Save weekly review
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Iris&apos;s voice</h3>
                <VoicePicker />
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">What Iris remembers</h3>
                <IrisMemoryPanel googleConnected={googleConnected} />
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Iris usage</h3>
                <IrisUsagePanel googleConnected={googleConnected} timeZone={settings.timezone} />
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Morning digest &amp; push</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  Daily email at your briefing hour (requires Google reconnect for send permission).
                </p>
                <label className="text-xs text-alfred-mist" htmlFor="briefing-hour">Briefing hour (4–11)</label>
                <input
                  id="briefing-hour"
                  type="number"
                  min={4}
                  max={11}
                  className="input-field mb-2"
                  value={briefingHour}
                  onChange={(e) => setBriefingHour(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-alfred-mist mb-2">
                  <input type="checkbox" checked={morningDigest} onChange={(e) => setMorningDigest(e.target.checked)} />
                  Email morning digest to connected Gmail
                </label>
                <label className="flex items-center gap-2 text-sm text-alfred-mist mb-2">
                  <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} />
                  Push: leave-by, wind-down &amp; urgent items
                </label>
                {push.error && <p className="text-sm text-red-300/90 mb-2">{push.error}</p>}
                {push.subscribed && <p className="text-xs text-emerald-400/80 mb-2">Push notifications active</p>}
                <button
                  type="button"
                  className="btn-gold w-full"
                  disabled={push.loading}
                  onClick={() =>
                    void onSaveNotifications({
                      briefingHour: Math.min(11, Math.max(4, Number(briefingHour) || 4)),
                      morningDigestEnabled: morningDigest,
                      pushNotificationsEnabled: pushEnabled,
                    })
                  }
                >
                  {push.loading ? "Enabling…" : "Save notifications"}
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Woodhouse apps</h3>
                <WoodhouseNodesEditor nodes={nodes} onChange={setNodes} />
                <button
                  type="button"
                  className="btn-gold mt-3 w-full"
                  onClick={() => {
                    onSaveWoodhouseNodes(nodes);
                  }}
                >
                  Save &amp; sync all nodes
                </button>
              </div>
              <div className="border-t border-alfred-border pt-6">
                <h3 className="text-sm font-medium mb-2">Google account</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  Gmail (read + send digest), Calendar (read-only). Tokens stay on the server.
                </p>
                {googleConnectionError ? (
                  <p className="text-sm text-red-400 mb-3" role="alert">
                    {googleConnectionError}
                  </p>
                ) : null}
                {googleConnected ? (
                  <div className="space-y-2">
                    <p className="text-sm text-alfred-cream">{accountEmail}</p>
                    <button type="button" className="btn-ghost border border-alfred-border w-full" onClick={onDisconnectGoogle}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <details className="google-setup-checklist rounded-md border border-alfred-border/60 bg-black/40 p-3">
                      <summary className="cursor-pointer text-sm text-alfred-gold">
                        Google setup checklist (if connect fails)
                      </summary>
                      <ol className="mt-3 space-y-2 text-xs text-alfred-mist list-decimal list-inside">
                        <li>
                          <a
                            className="text-alfred-gold underline"
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Google Cloud → Credentials
                          </a>
                          : create a <strong>Web application</strong> OAuth client
                        </li>
                        <li>
                          Authorized redirect URI (copy exactly):{" "}
                          <code className="block mt-1 break-all rounded bg-black/60 px-2 py-1 text-alfred-cream">
                            {`${window.location.origin}/api/auth-callback`}
                          </code>
                        </li>
                        <li>API Library: enable <strong>Gmail API</strong> and <strong>Google Calendar API</strong></li>
                        <li>
                          OAuth consent screen → add your Gmail as a <strong>Test user</strong> (required while app is in Testing)
                        </li>
                        <li>
                          Netlify → Site configuration → Environment variables:{" "}
                          <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>
                          <span className="block mt-1 text-alfred-mist/80">
                            Scope must be <strong>Functions</strong> or <strong>All</strong> (not Builds only). Then Trigger deploy.
                          </span>
                        </li>
                        <li>Save env vars, then <strong>Trigger deploy</strong> (changes don&apos;t apply until redeploy)</li>
                        <li>
                          Verify:{" "}
                          <a className="text-alfred-gold underline" href="/api/google-oauth-status" target="_blank" rel="noopener noreferrer">
                            /api/google-oauth-status
                          </a>{" "}
                          → <code>configured: true</code> and matching <code>redirectUri</code>
                        </li>
                      </ol>
                    </details>
                    <button type="button" className="btn-gold w-full" onClick={onConnectGoogle}>
                      Connect Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
