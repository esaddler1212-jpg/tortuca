import { useEffect, useMemo, useState } from 'react';

import {
  getHudSnapshot,
  requestFastTravel,
  requestLandHere,
  requestSetNavTarget,
  requestSkipWaymo,
  requestToggleCamera,
  requestCycleAutopilotPreset,
  requestSavePhotoCard,
  requestToggleAutopilot,
  requestTogglePhoto,
  requestVistaCam,
  requestWaymoReplay,
  setTouchDrive,
  subscribeHud,
  type HudSnapshot
} from '../game-bridge';
import { DISTRICT_LABELS, LANDMARKS, districtLandmarkTotal, districtLandmarksVisited } from '../landmark-registry';
import type { DistrictId } from '../world-config';
import { Minimap } from './Minimap';
import { applyBayQualityPreset } from '../bay-quality';
import { isLandTargetAllowed, searchLandTargets } from '../city-land-search';
import { loadSettings, saveSettings, type GameSettings } from '../game-settings';
import { FAST_TRAVEL } from '../world-extras';
import { buildMissionBoard } from '../game-missions';
import { bayRegionsGated, syncVallejoMissionSteps, VALLEJO_CHAPTER_STEPS } from '../mission-chapters';
import { GAMEPAD_GLYPHS } from '../gamepad-hub';
import { setSimulationPaused } from '../console-graphics';
import { nextTaxiContract } from '../cpm-taxi';
import { requestBoardFlight, requestStartTaxi } from '../game-bridge';
import { TOKYO_LANDMARKS, tokyoUnlockStatus } from '../tokyo-map';
import { heatLabel } from '../game-heat';
import {
  exportProgressJson,
  getOrCreateSyncKey,
  importProgressJson,
  pullCloudProgress,
  pushCloudProgress
} from '../game-cloud-save';
import { loadProgress, normalizeProgress, saveProgress } from '../game-progress';
import { isTouchPrimary } from '../mobile-platform';
import { cameraModeLabel } from '../camera-profiles';
import { JournalPanel } from './JournalPanel';
import { SafehousePanel } from './SafehousePanel';
import { MusicPanel } from './MusicPanel';

function PinnedObjective({ snap }: { snap: HudSnapshot }) {
  if (snap.ridingWaymo || snap.photoMode || !snap.pinnedChapterLabel) return null;
  return (
    <div className="pinned-objective" aria-live="polite">
      <strong>Chapter</strong> — {snap.pinnedChapterLabel}
      {snap.pinnedChapterHint ? <span className="pinned-hint"> · {snap.pinnedChapterHint}</span> : null}
    </div>
  );
}

function HudDrawerTabs({ snap }: { snap: HudSnapshot }) {
  const [tab, setTab] = useState<'map' | 'missions' | 'garage' | 'settings'>('missions');

  useEffect(() => {
    const onTab = (ev: Event) => {
      const id = (ev as CustomEvent<'map' | 'missions' | 'garage' | 'settings'>).detail;
      setTab((cur) => (id !== 'missions' && cur === id ? 'missions' : id));
    };
    window.addEventListener('drive-world:hud-tab', onTab);
    return () => window.removeEventListener('drive-world:hud-tab', onTab);
  }, []);

  useEffect(() => {
    setSimulationPaused(tab !== 'missions' && snap.phase === 'home' && !snap.ridingWaymo && !snap.photoMode);
    return () => setSimulationPaused(false);
  }, [tab, snap.phase, snap.ridingWaymo, snap.photoMode]);

  if (snap.photoMode || snap.ridingWaymo) return null;
  return (
    <div className="hud-drawer-stack">
      {tab !== 'missions' && snap.phase === 'home' ? (
        <button type="button" className="paused-banner" onClick={() => setTab('missions')}>
          Paused — {snap.gamepadConnected ? `${GAMEPAD_GLYPHS.resume} to resume` : 'tap Missions or here to resume'}
        </button>
      ) : null}
      <div className="hud-tabs" role="tablist" aria-label="HUD panels">
        {(['map', 'missions', 'garage', 'settings'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`hud-tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {id === 'map' ? 'Map' : id === 'missions' ? 'Missions' : id === 'garage' ? 'Garage' : 'Settings'}
          </button>
        ))}
      </div>
      <div className="hud-tab-panel" role="tabpanel">
        {tab === 'map' && (
          <>
            <LandSearchPanel snap={snap} />
            <FastTravel snap={snap} />
            <LandmarkPanel snap={snap} />
          </>
        )}
        {tab === 'missions' && (
          <>
            {snap.landmarkSprintLabel ? (
              <div className="sprint-armed">Sprint: {snap.landmarkSprintLabel}</div>
            ) : null}
            <MissionBoard snap={snap} />
            <StatsPanel snap={snap} />
          </>
        )}
        {tab === 'garage' && (
          <>
            {snap.garageInteriorCam ? <div className="sprint-armed">Garage interior cam</div> : null}
            <RecordsPanel snap={snap} />
            <SafehousePanel snap={snap} />
          </>
        )}
        {tab === 'settings' && (
          <>
            <SettingsPanel />
            <MusicPanel />
            <JournalPanel snap={snap} />
          </>
        )}
      </div>
    </div>
  );
}

function NavHint({ snap }: { snap: HudSnapshot }) {
  if (snap.ridingWaymo || snap.photoMode) return null;
  const pin =
    snap.navTarget ??
    snap.navObjective ??
    (snap.nextLandmark
      ? { label: snap.nextLandmark.name, x: snap.nextLandmark.x, z: snap.nextLandmark.z }
      : null);
  if (!pin) return null;
  const dist = Math.hypot(pin.x - snap.playerX, pin.z - snap.playerZ);
  const distMi = (dist / 1000) * 0.62;
  const turn = snap.navTurnLabel;
  return (
    <div className="nav-hint">
      <strong>{snap.navTarget ? 'Route:' : 'Next:'}</strong> {pin.label} · {distMi.toFixed(1)} mi
      {turn ? <span className="nav-turn"> — {turn}</span> : null}
      {snap.navTarget ? (
        <button type="button" className="link-btn nav-clear" onClick={() => requestSetNavTarget(null)}>
          Clear route
        </button>
      ) : null}
    </div>
  );
}

function LandSearchPanel({ snap }: { snap: HudSnapshot }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const all = searchLandTargets(q);
    if (!snap.progress) return all;
    return all.filter((t) => isLandTargetAllowed(snap.progress!, t));
  }, [q, snap.progress]);
  if (snap.photoMode || snap.ridingWaymo || snap.phase !== 'home') return null;
  return (
    <details className="land-search-panel">
      <summary>City map search</summary>
      <input
        className="land-search-input"
        type="search"
        placeholder="Hub or landmark…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="land-search-list">
        {hits.map((t) => (
          <li key={t.id}>
            <span>
              {t.label}
              <span className="land-search-kind">
                {t.kind === 'hub' ? ' hub' : t.kind === 'scenic' ? ' cruise' : ''}
              </span>
            </span>
            <span className="land-search-actions">
              <button
                type="button"
                className="link-btn"
                onClick={() =>
                  requestSetNavTarget({
                    label: t.label,
                    x: t.x,
                    z: t.z,
                    scenicId: t.scenicId
                  })
                }
              >
                Route
              </button>
              <button type="button" className="link-btn" onClick={() => requestLandHere(t.x, t.z, t.label)}>
                Land here
              </button>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function LandmarkPanel({ snap }: { snap: HudSnapshot }) {
  const visited = new Set(snap.progress?.visitedLandmarkIds ?? []);
  return (
    <details className="landmark-panel" {...(isTouchPrimary() ? {} : { open: true })}>
      <summary>Landmarks ({visited.size}/{LANDMARKS.length})</summary>
      <ul>
        {(Object.keys(DISTRICT_LABELS) as DistrictId[]).map((d) => {
          const v = districtLandmarksVisited(snap.progress?.visitedLandmarkIds ?? [], d);
          const t = districtLandmarkTotal(d);
          const complete = v === t;
          return (
            <li key={d} className={complete ? 'region-done' : ''}>
              {DISTRICT_LABELS[d]} {v}/{t}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function RecordsPanel({ snap }: { snap: HudSnapshot }) {
  const p = snap.progress;
  if (!p) return null;
  const synced = syncVallejoMissionSteps(p);
  const mastery = VALLEJO_CHAPTER_STEPS.filter((s) => synced.missionStepsCompleted.includes(s.id)).length;
  const parkStars = Object.values(p.parkingStars).reduce((a, b) => a + b, 0);
  const traps = Object.keys(p.speedTrapBests).length;
  const tokyo = tokyoUnlockStatus(p);
  return (
    <details className="records-panel" open={!isTouchPrimary()}>
      <summary>Records · trophies</summary>
      <ul className="records-list">
        <li>Landmarks {p.visitedLandmarkIds.length}</li>
        <li>Garage unlocks {p.unlockedVehicleIds.length}</li>
        <li>Regions {p.unlockedRegionIds.length} / 6</li>
        <li>Parking ★ {parkStars}</li>
        <li>Speed traps logged {traps}</li>
        <li>Heat peak {p.heatPeakEver?.toFixed(1) ?? '0'} / 5</li>
        <li>Meet badges {p.meetBadges?.length ?? 0}</li>
        <li>Vallejo mastery {mastery} / {VALLEJO_CHAPTER_STEPS.length}</li>
        <li>Scenic routes {p.scenicCompleted.length}</li>
        <li>
          {tokyo.unlocked
            ? `Tokyo landmarks ${p.tokyoLandmarkIds.length} / ${TOKYO_LANDMARKS.length} · flights ${p.tokyoFlights}`
            : `Tokyo bonus: cars ${tokyo.cars}/${tokyo.carsTotal} · regions ${tokyo.regions}/${tokyo.regionsTotal}`}
        </li>
      </ul>
    </details>
  );
}

function GamepadGlyphs({ connected }: { connected: boolean }) {
  if (!connected) return null;
  return (
    <div className="gamepad-glyphs" aria-label="Controller hints">
      <span>{GAMEPAD_GLYPHS.drive}</span>
      <span>Cam {GAMEPAD_GLYPHS.camera}</span>
      <span>{GAMEPAD_GLYPHS.photo}</span>
      <span>{GAMEPAD_GLYPHS.map}</span>
    </div>
  );
}

function StatsPanel({ snap }: { snap: HudSnapshot }) {
  const id = snap.progress?.activeVehicleId;
  if (!id || !snap.progress) return null;
  const st = snap.progress.vehicleStats[id];
  if (!st) return null;
  return (
    <div className="stats-panel">
      Miles: {st.miles.toFixed(2)} · Top: {Math.round(st.topMph)} mph
    </div>
  );
}

function HeatMeter({ snap }: { snap: HudSnapshot }) {
  const heat = snap.progress?.heatLevel ?? 0;
  if (heat < 0.35 || snap.ridingWaymo) return null;
  const pct = Math.min(100, (heat / 5) * 100);
  return (
    <div className={`heat-meter ${snap.heatHunted ? 'hunted' : ''}`} title="Speed-trap heat">
      Heat: {heatLabel(heat)} ({Math.round(pct)}%)
      <div className="heat-bar">
        <div className="heat-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RacingHud({ snap }: { snap: HudSnapshot }) {
  if (snap.photoMode || snap.ridingWaymo || snap.phase !== 'home') return null;
  const drift = snap.driftScore ?? 0;
  const showDrift = drift > 2 || snap.driftPadName;
  const nitro = snap.nitroPercent ?? 100;
  const showNitro = !snap.flightMode && nitro < 99.5;
  const tree = snap.dragTreeLabel;
  const showTree = Boolean(tree);
  const time = snap.timeAttackElapsedMs;
  const showTime = time != null && time > 0;
  const ghost = snap.ghostRivalLabel;
  const showGhost = Boolean(ghost);
  if (!showDrift && !showNitro && !showTree && !showTime && !showGhost) return null;
  const driftPct = snap.driftGoal ? Math.min(100, (drift / snap.driftGoal) * 100) : Math.min(100, drift / 10);
  return (
    <div className="racing-hud" aria-live="polite">
      {showTree ? (
        <div className="race-strip drag-tree">{tree === 'GO' ? 'GO!' : tree}</div>
      ) : null}
      {showGhost ? <div className="race-strip ghost-rival">{ghost}</div> : null}
      {showDrift ? (
        <div className="race-strip drift">
          Drift {Math.round(drift)}
          {snap.driftPadName ? ` · ${snap.driftPadName}` : ''}
          <div className="race-bar">
            <div className="race-bar-fill drift" style={{ width: `${driftPct}%` }} />
          </div>
        </div>
      ) : null}
      {showTime ? (
        <div className="race-strip">
          Time {(time! / 1000).toFixed(2)}s {snap.timeAttackProgress ? `· ${snap.timeAttackProgress}` : ''}
        </div>
      ) : null}
      {showNitro ? (
        <div className="race-strip nitro">
          N₂O {snap.nitroBoosting ? 'BOOST' : 'Tank'} {Math.round(nitro)}%
          <div className="race-bar">
            <div
              className="race-bar-fill nitro"
              style={{ width: `${nitro}%`, opacity: snap.nitroBoosting ? 1 : 0.85 }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MissionBoard({ snap }: { snap: HudSnapshot }) {
  if (!snap.progress || snap.photoMode || snap.ridingWaymo) return null;
  const lines = buildMissionBoard(
    snap.progress,
    snap.playerX,
    snap.playerZ,
    snap.settings.fuelSimEnabled ? snap.fuelPercent : undefined
  );
  const taxiOffer = snap.progress ? nextTaxiContract(snap.progress, 'vallejo') : null;
  return (
    <details className="mission-panel" {...(isTouchPrimary() ? {} : { open: true })}>
      <summary>Missions · CPM · Horizon · MC</summary>
      {taxiOffer && !snap.progress?.activeTaxiId ? (
        <button
          type="button"
          className="link-btn mission-taxi-start"
          onClick={() => requestStartTaxi(taxiOffer.id)}
        >
          Start courier: {taxiOffer.label}
        </button>
      ) : null}
      <ul>
        {lines.map((m) => (
          <li key={m.id} className={m.done ? 'mission-done' : ''}>
            {m.label}
            {m.hint ? <span className="mission-hint"> — {m.hint}</span> : null}
            {m.action === 'taxi' && !m.done && taxiOffer ? (
              <button type="button" className="link-btn" onClick={() => requestStartTaxi(taxiOffer.id)}>
                Start
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

function SettingsPanel() {
  const [s, setS] = useState<GameSettings>(loadSettings());
  const [syncMsg, setSyncMsg] = useState('');
  const apply = (next: GameSettings) => {
    setS(next);
    saveSettings(next);
    window.dispatchEvent(new CustomEvent('drive-world:settings', { detail: next }));
  };
  const syncKey = getOrCreateSyncKey();
  return (
    <details className="settings-panel">
      <summary>Settings</summary>
      <p className="sync-key-line">
        Cloud sync key: <code>{syncKey}</code>
      </p>
      <div className="sync-actions">
        <button
          type="button"
          className="sync-btn"
          onClick={async () => {
            const remote = normalizeProgress(await pullCloudProgress());
            if (remote) {
              saveProgress(remote);
              setSyncMsg('Pulled cloud save — reload to apply');
            } else setSyncMsg('No cloud save for this key');
          }}
        >
          Pull cloud
        </button>
        <button
          type="button"
          className="sync-btn"
          onClick={async () => {
            const ok = await pushCloudProgress(loadProgress());
            setSyncMsg(ok ? 'Pushed to cloud' : 'Push failed (enable Netlify Blobs)');
          }}
        >
          Push cloud
        </button>
        <button
          type="button"
          className="sync-btn"
          onClick={() => {
            void navigator.clipboard?.writeText(exportProgressJson());
            setSyncMsg('Copied save JSON');
          }}
        >
          Copy JSON
        </button>
      </div>
      {syncMsg ? <p className="sync-msg">{syncMsg}</p> : null}
      <label className="slider-row">
        Import JSON
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            setSyncMsg(importProgressJson(text) ? 'Imported — reload page' : 'Invalid save file');
          }}
        />
      </label>
      <label className="slider-row">
        Master volume
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(s.masterVolume * 100)}
          onChange={(e) => apply({ ...s, masterVolume: Number(e.target.value) / 100 })}
        />
      </label>
      <label className="slider-row">
        SFX / engine
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((s.sfxVolume ?? 0.9) * 100)}
          onChange={(e) => apply({ ...s, sfxVolume: Number(e.target.value) / 100 })}
        />
      </label>
      <label className="slider-row">
        Bay quality preset
        <select
          value={s.bayQualityPreset ?? 'balanced'}
          onChange={(e) =>
            apply(applyBayQualityPreset(s, e.target.value as GameSettings['bayQualityPreset']))
          }
        >
          <option value="chromebook">Chromebook (light)</option>
          <option value="balanced">Balanced</option>
          <option value="console">Console / TV</option>
          <option value="lush">Lush nights</option>
        </select>
      </label>
      <label className="slider-row">
        Frame cap
        <select
          value={String(s.frameCapFps ?? 0)}
          onChange={(e) =>
            apply({ ...s, frameCapFps: Number(e.target.value) as GameSettings['frameCapFps'] })
          }
        >
          <option value="0">Uncapped</option>
          <option value="30">30 fps (Performance)</option>
          <option value="60">60 fps</option>
        </select>
      </label>
      <label className="slider-row">
        Resolution scale
        <input
          type="range"
          min={50}
          max={100}
          value={Math.round((s.resolutionScale ?? 1) * 100)}
          onChange={(e) => apply({ ...s, resolutionScale: Number(e.target.value) / 100 })}
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={!!s.tvHudMode}
          onChange={(e) => apply({ ...s, tvHudMode: e.target.checked })}
        />
        TV / couch HUD (larger text)
      </label>
      <label className="slider-row">
        Fog
        <select
          value={s.fogQuality}
          onChange={(e) => apply({ ...s, fogQuality: e.target.value as GameSettings['fogQuality'] })}
        >
          <option value="low">Low</option>
          <option value="med">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.showTraffic}
          onChange={(e) => apply({ ...s, showTraffic: e.target.checked })}
        />
        Ambient traffic
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.coastalWeatherEnabled !== false}
          onChange={(e) => apply({ ...s, coastalWeatherEnabled: e.target.checked })}
        />
        Coastal rain (SF / Marin)
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.shareSessionStats !== false}
          onChange={(e) => apply({ ...s, shareSessionStats: e.target.checked })}
        />
        Share anonymous play-time stats
      </label>
      <p className="sync-msg">
        <a
          className="link-btn"
          href="https://github.com/esaddler1212-jpg/tortuca/issues/new?labels=city-nights&title=City%20Nights%20feedback"
          target="_blank"
          rel="noreferrer"
        >
          Send feedback (GitHub)
        </a>
      </p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.fuelSimEnabled}
          onChange={(e) => apply({ ...s, fuelSimEnabled: e.target.checked })}
        />
        Fuel sim (free pumps)
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.showSideshow}
          onChange={(e) => apply({ ...s, showSideshow: e.target.checked })}
        />
        Sideshow meetups
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.hubStreamingEnabled}
          onChange={(e) => apply({ ...s, hubStreamingEnabled: e.target.checked })}
        />
        Hub streaming (reload to fully toggle)
      </label>
    </details>
  );
}

function FastTravel({ snap }: { snap: HudSnapshot }) {
  if (!snap.nearGarage || !snap.progress) return null;
  const unlocked = new Set(snap.progress.unlockedRegionIds);
  const gated = bayRegionsGated(snap.progress);
  return (
    <div className="fast-travel">
      <div className="fast-travel-title">Waymo fast travel</div>
      {FAST_TRAVEL.filter((f) => !gated || f.district === 'vallejo').map((f) => (
        <button
          key={f.district}
          type="button"
          disabled={!unlocked.has(f.district)}
          className="fast-travel-btn"
          onClick={() => requestFastTravel(f.district)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function HudApp() {
  const [snap, setSnap] = useState<HudSnapshot>(getHudSnapshot());

  useEffect(() => subscribeHud(setSnap), []);

  const showTouch =
    typeof window !== 'undefined' && isTouchPrimary() && !snap.photoMode && snap.phase === 'home' && !snap.ridingWaymo;
  const pad = !!snap.gamepadConnected;
  const camLabel = pad ? `Cam ${GAMEPAD_GLYPHS.camera}` : `Camera: ${cameraModeLabel(snap.cameraMode)} (C)`;
  const photoLabel = pad ? `Photo ${GAMEPAD_GLYPHS.photo}` : `Photo ${snap.photoMode ? 'ON' : ''} (P)`;

  return (
    <div
      className={`react-hud ${snap.photoMode ? 'photo-active' : ''} ${snap.settings.tvHudMode ? 'react-hud--tv' : ''}`}
    >
      {snap.flightCinematic ? (
        <>
          <div className="flight-fade" style={{ opacity: snap.flightCinematic.fade }} aria-hidden />
          <div className="flight-banner" aria-live="polite">
            ✈ {snap.flightCinematic.label}
          </div>
        </>
      ) : null}
      {snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestSkipWaymo()}>
          {snap.flightCinematic
            ? `Land now${pad ? ` (${GAMEPAD_GLYPHS.skip})` : ''}`
            : pad
              ? `Skip ride (${GAMEPAD_GLYPHS.skip})`
              : 'Skip prologue ride'}
        </button>
      )}
      {snap.flightPrompt && !snap.ridingWaymo && !snap.photoMode && (
        <button
          type="button"
          className={`flight-prompt ${snap.flightPrompt.ready ? 'ready' : 'locked'}`}
          onClick={() => requestBoardFlight()}
        >
          ✈ {snap.flightPrompt.label}
          {snap.flightPrompt.ready ? ` (${pad ? GAMEPAD_GLYPHS.flight : 'F'})` : ''}
          {snap.flightPrompt.detail ? <span className="flight-prompt-detail">{snap.flightPrompt.detail}</span> : null}
        </button>
      )}
      <GamepadGlyphs connected={pad} />
      {(snap.streetName || snap.storefrontStripLabel) && !snap.photoMode && !snap.ridingWaymo && (
        <div className="street-blade" aria-live="polite">
          {snap.storefrontStripLabel ?? snap.streetName}
        </div>
      )}
      <div className="hud-toolbar">
        <button type="button" className="cam-toggle" onClick={() => requestToggleCamera()}>
          {camLabel}
        </button>
        <button type="button" className="cam-toggle" onClick={() => requestTogglePhoto()}>
          {photoLabel}
        </button>
        <span className="hud-mph">{Math.round(snap.mph)} mph</span>
        {snap.progress?.activeVehicleId === 'bonus-night-coil' && snap.phase === 'home' && !snap.ridingWaymo && (
          <button
            type="button"
            className={`cam-toggle autopilot-btn ${snap.autopilotActive ? 'on' : ''}`}
            onClick={() => requestToggleAutopilot()}
          >
            {snap.autopilotActive ? `Autopilot ${snap.autopilotPreset ?? 'tour'} (T)` : 'Autopilot (T)'}
          </button>
        )}
        {snap.progress?.activeVehicleId === 'bonus-night-coil' && snap.phase === 'home' && (
          <button type="button" className="cam-toggle" onClick={() => requestCycleAutopilotPreset()}>
            Preset (Y)
          </button>
        )}
      </div>
      {!snap.photoMode && <Minimap snap={snap} />}
      {snap.atVista && !snap.photoMode && (
        <div className="vista-hint">
          <strong>{snap.vistaName}</strong> — slow orbit · <button type="button" className="link-btn" onClick={() => requestVistaCam()}>Vista cam (V)</button>
        </div>
      )}
      <PinnedObjective snap={snap} />
      <NavHint snap={snap} />
      {snap.flightMode && !snap.photoMode && (
        <p className="flight-hint">Space/⤒ climb · Ctrl/⤓ sink · WASD · Shift boost</p>
      )}
      <RacingHud snap={snap} />
      <HeatMeter snap={snap} />
      {snap.settings.fuelSimEnabled && snap.phase === 'home' && !snap.photoMode && (
        <div className="fuel-meter" aria-label="Fuel">
          Fuel {snap.fuelPercent ?? 100}%
          {snap.nearGas ? ' · filling…' : ''}
        </div>
      )}
      {snap.parkingSpotName && !snap.photoMode && (
        <div className="parking-hint">{snap.parkingSpotName}</div>
      )}
      {snap.activeSideshowName && !snap.photoMode && (
        <div className="parking-hint">Sideshow tonight: {snap.activeSideshowName}</div>
      )}
      <HudDrawerTabs snap={snap} />
      {snap.nearGarageReplay && snap.phase === 'home' && !snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestWaymoReplay()}>
          Replay Waymo intro route
        </button>
      )}
      {showTouch && <TouchControlsImpl flight={!!snap.flightMode} />}
      {snap.photoMode && (
        <p className="photo-hint">
          WASD move · Q/E altitude · P exit ·{' '}
          <button type="button" className="link-btn" onClick={() => requestSavePhotoCard()}>
            Save cruise card
          </button>
        </p>
      )}
    </div>
  );
}

function TouchControlsImpl({ flight }: { flight: boolean }) {
  const press =
    (key: 'up' | 'down' | 'left' | 'right' | 'climb' | 'descend' | 'nitro', down: boolean) =>
    (e: React.PointerEvent) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('drive-world:unlock-audio'));
      setTouchDrive({ [key]: down });
    };
  const clearAll = () => {
    setTouchDrive({
      up: false,
      down: false,
      left: false,
      right: false,
      climb: false,
      descend: false,
      nitro: false
    });
  };
  return (
    <div
      className={`touch-drive ${flight ? 'touch-flight' : ''}`}
      aria-label="Touch driving controls"
      onPointerCancel={clearAll}
    >
      <button type="button" className="touch-btn up" onPointerDown={press('up', true)} onPointerUp={press('up', false)} onPointerLeave={press('up', false)}>
        ▲
      </button>
      <button type="button" className="touch-btn down" onPointerDown={press('down', true)} onPointerUp={press('down', false)} onPointerLeave={press('down', false)}>
        ▼
      </button>
      <button type="button" className="touch-btn left" onPointerDown={press('left', true)} onPointerUp={press('left', false)} onPointerLeave={press('left', false)}>
        ◀
      </button>
      <button type="button" className="touch-btn right" onPointerDown={press('right', true)} onPointerUp={press('right', false)} onPointerLeave={press('right', false)}>
        ▶
      </button>
      <button
        type="button"
        className="touch-btn nitro"
        onPointerDown={press('nitro', true)}
        onPointerUp={press('nitro', false)}
        onPointerLeave={press('nitro', false)}
      >
        N₂O
      </button>
      {flight ? (
        <>
          <button
            type="button"
            className="touch-btn climb"
            onPointerDown={press('climb', true)}
            onPointerUp={press('climb', false)}
            onPointerLeave={press('climb', false)}
          >
            ⤒
          </button>
          <button
            type="button"
            className="touch-btn descend"
            onPointerDown={press('descend', true)}
            onPointerUp={press('descend', false)}
            onPointerLeave={press('descend', false)}
          >
            ⤓
          </button>
        </>
      ) : null}
    </div>
  );
}
