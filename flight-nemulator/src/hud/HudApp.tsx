import { useEffect, useState } from 'react';
import { getHudSnapshot, setTouchFlight } from '../game-bridge';
import { HERO_ROSTER } from '../hero-roster';
import {
  customizationBlurb,
  isFullLoadoutHero,
  listHeroLoadouts,
  loadoutStatsLabel,
  suitRoleLabel
} from '../hero-customization';
import type { HeroForm, SuitRole } from '../hero-roster';
import { canPickAlignment, DUAL_ROLE_HERO_ID, isVillainOnlyHero } from '../hero-alignment';
import { isDoomGodEmperor } from '../doom-story-arc';
import {
  confirmTerritoryHenchmen,
  confirmTerritoryRaze,
  confirmVillainWorldRemake,
  continueDyingRoam,
  requestLanternAidAtSafeHouse,
  selectHero,
  selectPlayerRole
} from '../game-loop';
import { storedFormId } from '../hero-forms';
import { ANNIHILATE_HAVOC_USD } from '../villain-annihilate';
import { getPlayerRole, type PlayerRole } from '../player-role';
import { loadCustomHeroes, saveCustomHero, type CustomHeroDraft } from '../custom-hero';
import { researchHeroBundle } from '../character-research';
import { arcPickerLine, arcPickerLinks } from '../battleworld-arcs';
import { HERO_MUTATIONS } from '../roster-mutations';
import { Minimap } from './Minimap';
import { setQualityOverride } from '../game-settings';
import { downloadPhoto } from '../photo-mode';
import type { QualityTier } from '../quality-tier';
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
  heroX?: number;
  heroZ?: number;
  dronesLeft?: number;
  lifetimeDestructionUsd?: number;
  dronesDestroyed?: number;
  loadingTip?: string;
  manifestHints?: string[];
  orbitProgress?: number;
  chronoArmed?: boolean;
  chronoFrozen?: boolean;
  worldGeneration?: number;
  playerRole?: PlayerRole;
  cityStatus?: string;
  foesStopped?: number;
  annihilateUnlocked?: boolean;
  annihilateProgress?: number;
  solarCharge?: number;
  nearestFoe?: string | null;
  villainRivals?: string[];
  pairBossName?: string | null;
  pairBossHpPct?: number | null;
  pairBossStatus?: 'incoming' | 'active' | 'defeated' | null;
  fatePrompt?: boolean;
  dyingRoamSeconds?: number;
  worldFatePhase?: string;
  heroWorldSaved?: boolean;
  aerialMobility?: string;
  loadoutLabel?: string;
  symbioteUnlocked?: boolean;
  absorptionLabel?: string | null;
  venomBondLabel?: string | null;
  alignmentNote?: string | null;
  lanternSafehouseNear?: boolean;
  lanternArcHint?: string | null;
  doomStoryHint?: string | null;
  territoryHint?: string | null;
  villainAdvisorHint?: string | null;
  pairBossBlocked?: boolean;
  takeoverDistricts?: number;
  villainScoutHint?: string | null;
  battleworldTagline?: string | null;
  infinityStoneHint?: string | null;
  characterArcHint?: string | null;
  latticeHint?: string | null;
  latticeCloudHint?: string | null;
  latticeBeatChip?: string | null;
  villainRunwayHint?: string | null;
  chapterHint?: string | null;
  chapterChip?: string | null;
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
  const arcLine = arcPickerLine(heroId);
  const arcLinks = arcPickerLinks(heroId);
  const universe = HERO_MUTATIONS[heroId]?.universe;

  return (
    <div className="hud-root">
      <div className="hud-top">
        <div className="hud-panel">
          <div className="hud-hero">{snap.heroName}</div>
          {snap.battleworldTagline && (
            <div className="hud-tag hud-hint">{snap.battleworldTagline}</div>
          )}
          <div className="hud-tag">{snap.codename}</div>
          {snap.aerialMobility && <div className="hud-tag">{snap.aerialMobility}</div>}
          {snap.loadoutLabel && <div className="hud-tag">{snap.loadoutLabel}</div>}
          {snap.nearestFoe && (
            <div className="hud-tag">
              vs {snap.nearestFoe}
            </div>
          )}
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
          <div className="hud-tag">
            {snap.playerRole === 'villain' ? 'Heroes' : 'Raiders'} {snap.dronesLeft ?? 0}
          </div>
          {snap.cityStatus && (
            <div className={snap.cityStatus.startsWith('City') && snap.cityStatus.includes('0%') ? 'wanted' : 'hud-tag'}>
              {snap.cityStatus}
            </div>
          )}
          <div className="hud-tag">Lifetime {formatUsd(snap.lifetimeDestructionUsd ?? 0)}</div>
        </div>
      </div>

      <Minimap heroX={snap.heroX ?? 0} heroZ={snap.heroZ ?? 0} />

      <QualitySettings quality={snap.quality} photoMode={!!snap.photoMode} />
      <RolePicker role={snap.playerRole ?? getPlayerRole()} heroId={heroId} />
      <WorldFatePanel snap={snap} />

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
        {arcLine && (
          <p className="hud-tag hud-hint hud-arc-picker" title="Battleworld arc thread">
            {arcLine}
          </p>
        )}
        {arcLinks && <p className="hud-tag hud-hint">{arcLinks}</p>}
        {universe && <p className="hud-tag">Universe · {universe.toUpperCase()}</p>}
        {snap.playerRole === 'hero' && snap.villainRivals && snap.villainRivals.length > 0 && (
          <p className="hud-tag">Rivals: {snap.villainRivals.join(', ')}</p>
        )}
        {snap.pairBossStatus === 'incoming' && snap.pairBossName && (
          <p className="hud-tag">Pair rival incoming: {snap.pairBossName}</p>
        )}
        {snap.pairBossStatus === 'active' && snap.pairBossName && (
          <p className="hud-tag">
            Final pair duel: {snap.pairBossName} — HP {snap.pairBossHpPct ?? 100}%
          </p>
        )}
        {snap.pairBossStatus === 'defeated' && snap.pairBossName && (
          <p className="hud-tag">Pair rival down: {snap.pairBossName}</p>
        )}
        {snap.alignmentNote && <p className="hud-tag">{snap.alignmentNote}</p>}
        {snap.symbioteUnlocked && <p className="hud-tag">Symbiote suit unlocked — pick merged loadout</p>}
        {snap.absorptionLabel && <p className="hud-tag">{snap.absorptionLabel}</p>}
        {snap.venomBondLabel && <p className="hud-tag">{snap.venomBondLabel}</p>}
        {snap.lanternArcHint && <p className="hud-tag">{snap.lanternArcHint}</p>}
        {snap.doomStoryHint && <p className="hud-tag">{snap.doomStoryHint}</p>}
        {snap.territoryHint && <p className="hud-tag">{snap.territoryHint}</p>}
        {snap.villainAdvisorHint && <p className="hud-tag hud-hint">{snap.villainAdvisorHint}</p>}
        {snap.villainScoutHint && <p className="hud-tag">{snap.villainScoutHint}</p>}
        {snap.pairBossBlocked && (
          <p className="hud-tag">
            Final pair boss locked — clear takeovers
            {(snap.takeoverDistricts ?? 0) > 0
              ? ` (${snap.takeoverDistricts} district${snap.takeoverDistricts === 1 ? '' : 's'})`
              : ''}{' '}
            and defeat any God Emperor stone hunter
          </p>
        )}
        {snap.infinityStoneHint && <p className="hud-tag">{snap.infinityStoneHint}</p>}
        {snap.characterArcHint && <p className="hud-tag hud-hint">{snap.characterArcHint}</p>}
        {snap.latticeBeatChip && (
          <p className="hud-tag hud-lattice-chip" title="Territory · Stones · Home H · Pair · Save">
            Lattice {snap.latticeBeatChip}
          </p>
        )}
        {snap.villainRunwayHint && <p className="hud-tag hud-hint">{snap.villainRunwayHint}</p>}
        {snap.chapterChip && (
          <p className="hud-tag hud-lattice-chip" title="Battleworld chapter ladder">
            Chapters {snap.chapterChip}
          </p>
        )}
        {snap.chapterHint && <p className="hud-tag hud-hint">{snap.chapterHint}</p>}
        {snap.latticeHint && <p className="hud-tag">{snap.latticeHint}</p>}
        {snap.latticeCloudHint && <p className="hud-tag hud-hint">{snap.latticeCloudHint}</p>}
        {snap.territoryHint?.includes('H: henchmen') && (
          <div className="fate-actions">
            <button type="button" className="hud-roam" onClick={() => confirmTerritoryHenchmen()}>
              Henchmen hold (H)
            </button>
            <button type="button" className="hud-annihilate" onClick={() => confirmTerritoryRaze()}>
              Raze skyline (G)
            </button>
          </div>
        )}
        {snap.lanternSafehouseNear && snap.playerRole === 'hero' && heroId === 'solar-apex' && (
          <div className="fate-actions">
            <button type="button" className="hud-roam" onClick={() => requestLanternAidAtSafeHouse()}>
              Ask Emerald Pilot for final-boss aid (H)
            </button>
            <p className="hud-tag">Or strike the keeper (F) to steal the ring — you turn villain, yellow fear ring.</p>
          </div>
        )}
        <LoadoutPicker heroId={heroId} />
        <CreateHeroPanel
          onCreated={(id) => {
            setHeroId(id);
            selectHero(id);
          }}
        />
      </div>

      {snap.playerRole === 'villain' && !snap.annihilateUnlocked && (snap.annihilateProgress ?? 0) > 0.05 && (
        <p className="hud-hint">
          Annihilate unlock {Math.round((snap.annihilateProgress ?? 0) * 100)}% (
          {`$${(ANNIHILATE_HAVOC_USD / 1_000_000).toFixed(0)}M havoc`})
        </p>
      )}
      {snap.playerRole === 'villain' && snap.annihilateUnlocked && (
        <button type="button" className="hud-annihilate" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))}>
          Annihilate all Earth (X)
        </button>
      )}
      {(snap.solarCharge ?? 0) > 0.08 && (
        <p className="hud-hint hud-chrono">
          Solar charge {Math.round((snap.solarCharge ?? 0) * 100)}%
          {(snap.solarCharge ?? 0) >= 0.92 ? ' — space-charged blast' : ' — climb to space & fly fast'}
        </p>
      )}
      {snap.manifestHints && snap.manifestHints.length > 0 && (
        <p className="hud-hint">Free games: {snap.manifestHints.join(' · ')}</p>
      )}
      {snap.loadingTip && <p className="hud-hint">{snap.loadingTip}</p>}
      {snap.orbitProgress !== undefined && snap.orbitProgress > 0.05 && (
        <p className="hud-hint hud-chrono">
          World orbit {Math.round((snap.orbitProgress ?? 0) * 100)}%
          {snap.chronoArmed ? ' — TIME STOPPED · E shatter Earth' : ''}
          {snap.chronoFrozen && !snap.chronoArmed ? ' — chrono slip' : ''}
          {typeof snap.worldGeneration === 'number' ? ` · gen ${snap.worldGeneration}` : ''}
        </p>
      )}
      <p className="hud-hint">
        WASD steer · boost high around Earth (400+ km/h) · E super / shatter · P photo · H interact at
        Coast Lantern (Solar Apex)
      </p>

      <TouchPad />
    </div>
  );
}

function WorldFatePanel({ snap }: { snap: GameHudSnapshot }) {
  if (snap.heroWorldSaved && snap.playerRole === 'hero') {
    return (
      <p className="hud-hint hud-chrono">
        World saved — monument raised in {snap.district?.replace(/^Battleworld · /, '') ?? 'hometown'}
      </p>
    );
  }
  if (snap.worldFatePhase === 'dying_roam' && snap.playerRole === 'villain') {
    const mins = Math.floor((snap.dyingRoamSeconds ?? 0) / 60);
    const secs = (snap.dyingRoamSeconds ?? 0) % 60;
    return (
      <div className="hud-panel fate-panel">
        <strong>Dying Earth</strong>
        <p className="hud-tag">
          Roam {mins}:{secs.toString().padStart(2, '0')} then the planet resets — or remake it in your image.
        </p>
        {snap.fatePrompt && (
          <div className="fate-actions">
            <button type="button" className="hud-annihilate" onClick={() => confirmVillainWorldRemake()}>
              Remake in my image
            </button>
            <button type="button" className="hud-roam" onClick={() => continueDyingRoam()}>
              Keep roaming
            </button>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function RolePicker({ role, heroId }: { role: PlayerRole; heroId: string }) {
  if (isVillainOnlyHero(heroId)) {
    return (
      <p className="hud-tag settings-bar hud-panel">
        Alignment: Villain — defeat foes to absorb powers
      </p>
    );
  }
  if (heroId === 'solar-apex' && role === 'villain') {
    return (
      <p className="hud-tag settings-bar hud-panel">
        Alignment: Villain (fear ring — stole Emerald Pilot&apos;s ring)
      </p>
    );
  }
  if (heroId === DUAL_ROLE_HERO_ID && isDoomGodEmperor()) {
    return (
      <p className="hud-tag settings-bar hud-panel">
        Alignment: Villain (God Emperor — Battleworld throne)
      </p>
    );
  }
  if (!canPickAlignment(heroId)) {
    return (
      <p className="hud-tag settings-bar hud-panel">
        Alignment: Hero (only Latverian Sovereign can switch roles)
      </p>
    );
  }
  return (
    <div className="settings-bar hud-panel">
      <label>
        Doom alignment{' '}
        <select
          value={role}
          onChange={(e) => selectPlayerRole(e.target.value as PlayerRole)}
        >
          <option value="hero">Hero — sovereign protector</option>
          <option value="villain">Villain — monarch wrecking</option>
        </select>
      </label>
    </div>
  );
}

function QualitySettings({ quality, photoMode }: { quality: string; photoMode: boolean }) {
  return (
    <div className="settings-bar hud-panel">
      <label>
        Quality{' '}
        <select
          defaultValue={localStorage.getItem('flight-nemulator-quality') ?? 'auto'}
          onChange={(e) => {
            const v = e.target.value;
            setQualityOverride(v === 'auto' ? 'auto' : (v as QualityTier));
            window.location.reload();
          }}
        >
          <option value="auto">Auto ({quality})</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      {photoMode && (
        <button
          type="button"
          onClick={() => {
            const canvas = document.getElementById('application-canvas') as HTMLCanvasElement | null;
            if (canvas) void downloadPhoto(canvas, 'hero');
          }}
        >
          Save photo
        </button>
      )}
    </div>
  );
}

function LoadoutPicker({ heroId }: { heroId: string }) {
  const hero = HERO_ROSTER.find((h) => h.id === heroId);
  if (!hero) return null;
  const loadouts = listHeroLoadouts(hero);
  if (loadouts.length <= 1) return null;

  const [formId, setFormId] = useState(() => storedFormId(hero));

  useEffect(() => {
    const h = HERO_ROSTER.find((x) => x.id === heroId);
    if (h) setFormId(storedFormId(h));
  }, [heroId]);

  const active = loadouts.find((l) => l.id === formId) ?? loadouts[0];
  const full = isFullLoadoutHero(heroId);
  const blurb = customizationBlurb(heroId);

  const roleOrder: SuitRole[] = ['swift', 'siege', 'bulwark', 'balanced'];
  const byRole = (r: SuitRole) => loadouts.filter((o) => o.suitRole === r);

  return (
    <div className={`loadout-picker${full ? ' loadout-picker-full' : ''}`}>
      <strong>{full ? 'Suits & abilities' : 'Loadout'}</strong>
      {blurb && <p className="hud-tag">{blurb}</p>}
      <select
        className="loadout-select"
        value={formId}
        onChange={(e) => {
          const v = e.target.value;
          setFormId(v);
          selectHero(heroId, v);
        }}
      >
        {full ? (
          <>
            {roleOrder.map(
              (r) =>
                byRole(r).length > 0 && (
                  <optgroup key={r} label={suitRoleLabel(r)}>
                    {byRole(r).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                )
            )}
            {loadouts.filter((o) => !o.suitRole).map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </>
        ) : (
          loadouts.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))
        )}
      </select>
      {active && (
        <div className="loadout-preview">
          <span
            className="loadout-swatch"
            style={{
              background: `rgb(${Math.round(active.color[0] * 255)}, ${Math.round(active.color[1] * 255)}, ${Math.round(active.color[2] * 255)})`
            }}
          />
          {active.abilities.length > 0 && (
            <ul className="loadout-abilities">
              {active.abilities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <span className="hud-tag">{loadoutStatsLabel(active as unknown as HeroForm)}</span>
        </div>
      )}
    </div>
  );
}

function CreateHeroPanel({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('Sky Forger');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);

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
          const { drafts, cc0Assets } = await researchHeroBundle(name);
          setIdeas(drafts.map((d) => `${d.codename}: ${d.tagline}`));
          setAssets(cc0Assets.map((a) => `CC0: ${a.title}`));
        }}
      >
        Research ideas (offline ok)
      </button>
      {ideas.map((line) => (
        <div key={line} className="hud-tag">
          {line}
        </div>
      ))}
      {assets.map((line) => (
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
