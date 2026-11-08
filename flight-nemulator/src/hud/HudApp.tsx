import { useEffect, useState } from 'react';
import { getHudSnapshot, setTouchFlight } from '../game-bridge';
import { HERO_ROSTER } from '../hero-roster';
import { selectHero } from '../game-loop';
import { loadCustomHeroes, saveCustomHero, type CustomHeroDraft } from '../custom-hero';
import { researchNewHeroIdeas } from '../character-research';
import './hud.css';

export type GameHudSnapshot = {
  heroName: string;
  codename: string;
  district: string;
  speedKmh: number;
  destructionUsd: number;
  wantedStars: number;
  wave: number;
  stamina: number;
  staminaMax: number;
  superReady: boolean;
  quality: string;
  flightMode: boolean;
  photoMode?: boolean;
};

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export function HudApp() {
  const [snap, setSnap] = useState<GameHudSnapshot>(getHudSnapshot());
  const [heroId, setHeroId] = useState(
    () => localStorage.getItem('flight-nemulator-hero-id') ?? 'solar-apex'
  );

  useEffect(() => {
    const id = window.setInterval(() => setSnap({ ...getHudSnapshot() }), 100);
    return () => clearInterval(id);
  }, []);

  const stars = '★'.repeat(snap.wantedStars) + '☆'.repeat(5 - snap.wantedStars);
  const custom = loadCustomHeroes();

  return (
    <div className="hud-root">
      <div className="hud-top">
        <div className="hud-panel">
          <div className="hud-hero">{snap.heroName}</div>
          <div className="hud-tag">{snap.codename}</div>
          <div className="hud-tag">{snap.district}</div>
        </div>
        <div className="hud-panel">
          <div>{snap.speedKmh} km/h</div>
          <div>Damage {formatUsd(snap.destructionUsd)}</div>
          <div className="wanted">Wanted {stars}</div>
          <div>Wave {snap.wave}</div>
          <div>
            Energy {snap.stamina}/{snap.staminaMax}
          </div>
        </div>
      </div>

      <div className="hero-picker hud-panel">
        <strong>Hero &amp; home base</strong>
        <select
          value={heroId}
          onChange={(e) => {
            setHeroId(e.target.value);
            selectHero(e.target.value);
          }}
        >
          {HERO_ROSTER.map((h) => (
            <option key={h.id} value={h.id}>
              {h.codename} — {h.homeLabel}
            </option>
          ))}
          {custom.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codename} (custom)
            </option>
          ))}
        </select>
        <SuitPicker heroId={heroId} />
        <CreateHeroPanel
          onCreated={(id) => {
            setHeroId(id);
            selectHero(id);
          }}
        />
      </div>

      <p className="hud-hint">
        WASD steer · Space/Ctrl altitude · Shift boost · F fire · Q throw · E super · P photo
      </p>

      <TouchPad />
    </div>
  );
}

function SuitPicker({ heroId }: { heroId: string }) {
  const hero = HERO_ROSTER.find((h) => h.id === heroId);
  if (!hero?.suitVariants?.length && hero?.forms.length === 1) return null;
  const options = hero?.suitVariants
    ? hero.suitVariants.map((s) => ({ id: s.id, label: s.label }))
  : (hero?.forms.map((f) => ({ id: f.id, label: f.label })) ?? []);
  return (
    <select
      style={{ marginTop: 6, width: '100%' }}
      defaultValue={hero?.defaultFormId}
      onChange={(e) => selectHero(heroId, e.target.value)}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function CreateHeroPanel({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('Sky Forger');
  const [ideas, setIdeas] = useState<string[]>([]);

  return (
    <div style={{ marginTop: 10, fontSize: '0.85rem' }}>
      <strong>Create hero</strong>
      <input
        style={{ width: '100%', marginTop: 4 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        style={{ marginTop: 6, width: '100%' }}
        onClick={() => {
          const draft: CustomHeroDraft = {
            id: `custom-${Date.now()}`,
            codename: name.slice(0, 32),
            primaryColor: [0.4, 0.6, 0.95],
            power: 'beam',
            createdAt: new Date().toISOString()
          };
          saveCustomHero(draft);
          onCreated(draft.id);
        }}
      >
        Save &amp; fly
      </button>
      <button
        type="button"
        style={{ marginTop: 6, width: '100%' }}
        onClick={async () => {
          const drafts = await researchNewHeroIdeas(name);
          setIdeas(drafts.map((d) => `${d.codename}: ${d.tagline}`));
        }}
      >
        Research ideas (offline ok)
      </button>
      {ideas.map((line) => (
        <div key={line} className="hud-tag">
          {line}
        </div>
      ))}
    </div>
  );
}

function TouchPad() {
  const onStick = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (clientX - cx) / (rect.width / 2);
    const dy = (clientY - cy) / (rect.height / 2);
    setTouchFlight(
      {
        yaw: Math.max(-1, Math.min(1, dx)),
        pitch: Math.max(-1, Math.min(1, -dy)),
        vertical: 0,
        throttle: 0.9,
        boost: false,
        primary: false,
        throw: false,
        super: false
      },
      true
    );
  };

  return (
    <div className="touch-pad">
      <div
        className="touch-stick"
        onTouchStart={(e) => {
          const t = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          onStick(t.clientX, t.clientY, rect);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          onStick(t.clientX, t.clientY, rect);
        }}
        onTouchEnd={() => setTouchFlight({}, false)}
      />
      <div className="touch-actions">
        <button
          type="button"
          onTouchStart={() => setTouchFlight({ boost: true, throttle: 1 }, true)}
          onTouchEnd={() => setTouchFlight({ boost: false }, false)}
        >
          Boost
        </button>
        <button
          type="button"
          onTouchStart={() => setTouchFlight({ primary: true }, true)}
        >
          Fire
        </button>
        <button
          type="button"
          onTouchStart={() => setTouchFlight({ super: true }, true)}
        >
          Super
        </button>
      </div>
    </div>
  );
}
