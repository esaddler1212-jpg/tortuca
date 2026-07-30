import { useState } from "react";
import { Settings, X } from "lucide-react";
import type { UserSettings } from "../types";
import type { WoodhouseRegistryEntry } from "../types/woodhouse";
import { WoodhouseNodesEditor } from "./WoodhouseNodesEditor";

interface Props {
  settings: UserSettings;
  googleConnected: boolean;
  accountEmail?: string;
  onSaveCity: (city: string) => Promise<boolean>;
  onSaveWoodhouseNodes: (nodes: WoodhouseRegistryEntry[]) => void;
  onSaveCommute: (patch: Partial<Pick<UserSettings, "commuteMinutes" | "arriveBufferMinutes" | "schoolStartTime" | "schoolName">>) => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  saving: boolean;
  error: string | null;
}

export function SettingsDrawer({
  settings,
  googleConnected,
  accountEmail,
  onSaveCity,
  onSaveWoodhouseNodes,
  onSaveCommute,
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
                  <label className="text-xs text-alfred-mist" htmlFor="school-start">First bell (HH:MM)</label>
                  <input id="school-start" className="input-field" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} placeholder="08:00" />
                  <label className="text-xs text-alfred-mist" htmlFor="commute">Commute (minutes)</label>
                  <input id="commute" type="number" min={1} className="input-field" value={commute} onChange={(e) => setCommute(e.target.value)} />
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
                      commuteMinutes: Math.max(1, Number(commute) || 25),
                      arriveBufferMinutes: Math.max(0, Number(buffer) || 5),
                    })
                  }
                >
                  Save leave-by settings
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
                  Read-only access to Gmail and Calendar. Tokens stay on the server.
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
