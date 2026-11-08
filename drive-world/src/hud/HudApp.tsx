import { useEffect, useState } from 'react';

import {
  getHudSnapshot,
  requestFastTravel,
  requestSkipWaymo,
  requestToggleCamera,
  requestTogglePhoto,
  setTouchDrive,
  subscribeHud,
  type HudSnapshot
} from '../game-bridge';
import { DISTRICT_LABELS, LANDMARKS, districtLandmarkTotal, districtLandmarksVisited } from '../landmark-registry';
import { bearingDeg } from '../landmark-navigation';
import type { DistrictId } from '../world-config';
import { Minimap } from './Minimap';
import { loadSettings, saveSettings, type GameSettings } from '../game-settings';
import { FAST_TRAVEL } from '../world-extras';

function NavHint({ snap }: { snap: HudSnapshot }) {
  const next = snap.nextLandmark;
  if (!next || snap.ridingWaymo || snap.photoMode) return null;
  const brg = bearingDeg(snap.playerX, snap.playerZ, next.x, next.z);
  const dist = Math.hypot(next.x - snap.playerX, next.z - snap.playerZ);
  const distMi = (dist / 1000) * 0.62;
  return (
    <div className="nav-hint">
      <strong>Next:</strong> {next.name} · {distMi.toFixed(1)} mi · {Math.round(brg)}°
    </div>
  );
}

function LandmarkPanel({ snap }: { snap: HudSnapshot }) {
  const visited = new Set(snap.progress?.visitedLandmarkIds ?? []);
  return (
    <details className="landmark-panel" open>
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

function SettingsPanel() {
  const [s, setS] = useState<GameSettings>(loadSettings());
  const apply = (next: GameSettings) => {
    setS(next);
    saveSettings(next);
    window.dispatchEvent(new CustomEvent('drive-world:settings', { detail: next }));
  };
  return (
    <details className="settings-panel">
      <summary>Settings</summary>
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
    </details>
  );
}

function FastTravel({ snap }: { snap: HudSnapshot }) {
  if (!snap.nearGarage || !snap.progress) return null;
  const unlocked = new Set(snap.progress.unlockedRegionIds);
  return (
    <div className="fast-travel">
      <div className="fast-travel-title">Waymo fast travel</div>
      {FAST_TRAVEL.map((f) => (
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
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches && !snap.photoMode;

  return (
    <div className={`react-hud ${snap.photoMode ? 'photo-active' : ''}`}>
      {snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestSkipWaymo()}>
          Skip Waymo ride
        </button>
      )}
      <div className="hud-toolbar">
        <button type="button" className="cam-toggle" onClick={() => requestToggleCamera()}>
          Camera:{' '}
          {snap.cameraMode === 'cockpit' ? 'Cockpit' : snap.cameraMode === 'drone' ? 'Drone' : 'Chase'} (C)
        </button>
        <button type="button" className="cam-toggle" onClick={() => requestTogglePhoto()}>
          Photo {snap.photoMode ? 'ON' : ''} (P)
        </button>
        <span className="hud-mph">{Math.round(snap.mph)} mph</span>
      </div>
      {!snap.photoMode && <Minimap snap={snap} />}
      <NavHint snap={snap} />
      {snap.flightMode && !snap.photoMode && (
        <p className="flight-hint">Space climb · Ctrl sink · WASD steer · Shift boost</p>
      )}
      <StatsPanel snap={snap} />
      <SettingsPanel />
      <FastTravel snap={snap} />
      {!snap.photoMode && <LandmarkPanel snap={snap} />}
      {showTouch && snap.phase === 'home' && !snap.ridingWaymo && (
        <TouchControlsImpl />
      )}
      {snap.photoMode && (
        <p className="photo-hint">WASD move · Q/E altitude · P exit · Screenshot: system capture</p>
      )}
    </div>
  );
}

function TouchControlsImpl() {
  const press = (key: 'up' | 'down' | 'left' | 'right', down: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('drive-world:unlock-audio'));
    setTouchDrive({ [key]: down });
  };
  return (
    <div className="touch-drive" aria-label="Touch driving controls">
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
    </div>
  );
}
