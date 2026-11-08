import type { HudPrefs, ParticleViz } from "../../lib/hudPrefs";
import type { VoicePersonaPref } from "../../lib/voicePersona";

const VOICE: { id: VoicePersonaPref; label: string }[] = [
  { id: "auto", label: "Auto (Friday when voice is live)" },
  { id: "jarvis", label: "JARVIS — calm HUD" },
  { id: "friday", label: "FRIDAY — field ops energy" },
];

export function HudPrefsPanel({ prefs, onChange }: { prefs: HudPrefs; onChange: (patch: Partial<HudPrefs>) => void }) {
  const viz: ParticleViz[] = ["off", "orbits", "cortex", "strata"];
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-alfred-mist">
        <input
          type="checkbox"
          checked={prefs.combo135}
          onChange={(e) => onChange({ combo135: e.target.checked })}
        />
        Combo HUD: Reactor (phone) + Command deck (iPad) + Particle core
      </label>
      <label className="flex items-center gap-2 text-sm text-alfred-mist">
        <input
          type="checkbox"
          checked={prefs.reactorSkin}
          disabled={!prefs.combo135}
          onChange={(e) => onChange({ reactorSkin: e.target.checked })}
        />
        Stronger accent glow on phone gauges
      </label>
      <label className="flex items-center gap-2 text-sm text-alfred-mist">
        <input
          type="checkbox"
          checked={prefs.karaOrb}
          disabled={!prefs.combo135}
          onChange={(e) => onChange({ karaOrb: e.target.checked })}
        />
        K.A.R.A. filament orb (Original 01)
      </label>
      <label className="block text-xs text-alfred-mist" htmlFor="voice-persona">
        Voice HUD persona
      </label>
      <select
        id="voice-persona"
        className="input-field"
        value={prefs.voicePersona}
        onChange={(e) => onChange({ voicePersona: e.target.value as VoicePersonaPref })}
      >
        {VOICE.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-alfred-mist/80">
        Ultron-style brackets appear only when system status is degraded or offline. Lantern daily ritual:{" "}
        <code className="text-alfred-cream/90">gods-eye/LANTERN_RITUAL.md</code>
      </p>
      <label className="block text-xs text-alfred-mist" htmlFor="particle-viz">
        Particle visualization
      </label>
      <select
        id="particle-viz"
        className="input-field"
        value={prefs.particleViz}
        disabled={!prefs.combo135}
        onChange={(e) => onChange({ particleViz: e.target.value as ParticleViz })}
      >
        {viz.map((v) => (
          <option key={v} value={v}>
            {v === "off" ? "Off" : v.charAt(0).toUpperCase() + v.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
