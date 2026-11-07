import type { HudPrefs, ParticleViz } from "../../lib/hudPrefs";

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
      <label className="flex items-center gap-2 text-sm text-alfred-mist">
        <input
          type="checkbox"
          checked={prefs.lanternUnlock}
          onChange={(e) => onChange({ lanternUnlock: e.target.checked })}
        />
        Daily Futurist Lantern unlock
      </label>
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
      <p className="text-xs text-alfred-mist/80">
        Lantern assets: <code className="text-alfred-cream/90">npm run lantern:bootstrap</code> (Augma, CC BY-NC).
      </p>
    </div>
  );
}
