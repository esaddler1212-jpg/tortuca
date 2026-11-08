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
import { searchLandTargets } from '../city-land-search';
import { loadSettings, saveSettings, type GameSettings } from '../game-settings';
import { FAST_TRAVEL } from '../world-extras';
import { buildMissionBoard } from '../game-missions';
import { bayRegionsGated } from '../mission-chapters';
import { nextTaxiContract } from '../cpm-taxi';
import { requestStartTaxi } from '../game-bridge';
import { heatLabel } from '../game-heat';
import {
  exportProgressJson,
  getOrCreateSyncKey,
  importProgressJson,
  pullCloudProgress,
  pushCloudProgress
} from '../game-cloud-save';
import { loadProgress, saveProgress } from '../game-progress';
import { isTouchPrimary } from '../mobile-platform';
import { cameraModeLabel } from '../camera-profiles';
import { JournalPanel } from './JournalPanel';
import { SafehousePanel } from './SafehousePanel';
import { MusicPanel } from './MusicPanel';

function NavHint({ snap }: { snap: HudSnapshot }) {
  if (snap.ridingWaymo || snap.photoMode) return null;
  const pin =
    snap.navTarget ??
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
  const hits = useMemo(() => searchLandTargets(q), [q]);
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
  if (!showDrift && !showNitro && !showTree && !showTime) return null;
  const driftPct = snap.driftGoal ? Math.min(100, (drift / snap.driftGoal) * 100) : Math.min(100, drift / 10);
  return (
    <div className="racing-hud" aria-live="polite">
      {showTree ? (
        <div className="race-strip drag-tree">{tree === 'GO' ? 'GO!' : tree}</div>
      ) : null}
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
            const remote = await pullCloudProgress();
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
        Volume
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(s.masterVolume * 100)}
          onChange={(e) => apply({ ...s, masterVolume: Number(e.target.value) / 100 })}
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
          <option value="lush">Lush nights</option>
        </select>
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

  return (
    <div className={`react-hud ${snap.photoMode ? 'photo-active' : ''}`}>
      {snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestSkipWaymo()}>
          Skip Waymo ride
        </button>
      )}
      {(snap.streetName || snap.storefrontStripLabel) && !snap.photoMode && !snap.ridingWaymo && (
        <div className="street-blade" aria-live="polite">
          {snap.storefrontStripLabel ?? snap.streetName}
        </div>
      )}
      <div className="hud-toolbar">
        <button type="button" className="cam-toggle" onClick={() => requestToggleCamera()}>
          Camera: {cameraModeLabel(snap.cameraMode)} (C)
        </button>
        <button type="button" className="cam-toggle" onClick={() => requestTogglePhoto()}>
          Photo {snap.photoMode ? 'ON' : ''} (P)
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
      <NavHint snap={snap} />
      <LandSearchPanel snap={snap} />
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
      <SafehousePanel snap={snap} />
      <MusicPanel />
      <JournalPanel snap={snap} />
      <MissionBoard snap={snap} />
      <StatsPanel snap={snap} />
      <SettingsPanel />
      <FastTravel snap={snap} />
      {snap.nearGarageReplay && snap.phase === 'home' && !snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestWaymoReplay()}>
          Replay Waymo intro route
        </button>
      )}
      {!snap.photoMode && <LandmarkPanel snap={snap} />}
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
