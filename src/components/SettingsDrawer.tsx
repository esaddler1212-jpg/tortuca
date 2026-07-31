import { useState } from "react";
import { Settings, X } from "lucide-react";
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
  push: PushState;
  onSaveCity: (city: string) => Promise<boolean>;
  onSaveWoodhouseNodes: (nodes: WoodhouseRegistryEntry[]) => void;
  onSaveCommute: (
    patch: Partial<
      Pick<
        UserSettings,
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
  push,
  onSaveCity,
  onSaveWoodhouseNodes,
  onSaveCommute,
  onSaveNotifications,
  onConnectGoogle,
  onDisconnectGoogle,
  saving,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
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

  const save = async () => {
    const ok = await onSaveCity(city);
    if (ok) setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn-ghost fixed bottom-6 right-6 z-20 panel !rounded-full p-3 shadow-panel"
        onClick={() => setOpen(true)}
        aria-label="Settings"
      >
        <Settings className="h-5 w-5 text-alfred-gold" />
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/50" role="dialog" aria-modal>
          <div className="panel h-full w-full max-w-md p-6 overflow-y-auto border-l border-alfred-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-alfred-gold">Preferences</h2>
              <button type="button" className="btn-ghost p-2" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
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
                  Alfred calculates when to leave for school or your first calendar event.
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
                  <label className="text-xs text-alfred-mist" htmlFor="commute">Commute fallback (minutes)</label>
                  <input id="commute" type="number" min={1} className="input-field" value={commute} onChange={(e) => setCommute(e.target.value)} />
                  <label className="text-xs text-alfred-mist" htmlFor="home-address">Home address</label>
                  <input id="home-address" className="input-field" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="123 Main St, City" />
                  <label className="text-xs text-alfred-mist" htmlFor="school-address">School address</label>
                  <input id="school-address" className="input-field" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder="Oak Grove Middle School, City" />
                  <label className="flex items-center gap-2 text-sm text-alfred-mist mt-2">
                    <input type="checkbox" checked={useLiveCommute} onChange={(e) => setUseLiveCommute(e.target.checked)} />
                    Use live Google Maps commute (requires GOOGLE_MAPS_API_KEY)
                  </label>
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
                  Weekday alarm 4:15 AM — Alfred prompts for arms, body, legs, or cardio, then suggests a slot if you skip the morning.
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
                <h3 className="text-sm font-medium mb-2 text-alfred-gold">Evening wrap</h3>
                <p className="text-sm text-alfred-mist mb-3">
                  After this hour, Alfred shows your day summary and tomorrow preview.
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
                  Push: leave in 10 min &amp; urgent items
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
                {googleConnected ? (
                  <div className="space-y-2">
                    <p className="text-sm text-alfred-cream">{accountEmail}</p>
                    <button type="button" className="btn-ghost border border-alfred-border w-full" onClick={onDisconnectGoogle}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn-gold w-full" onClick={onConnectGoogle}>
                    Connect Google
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
