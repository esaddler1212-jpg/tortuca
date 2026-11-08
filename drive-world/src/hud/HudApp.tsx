import { useEffect, useState } from 'react';

import {
  getHudSnapshot,
  requestFastTravel,
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
import { bearingDeg } from '../landmark-navigation';
import type { DistrictId } from '../world-config';
import { Minimap } from './Minimap';
import { loadSettings, saveSettings, type GameSettings } from '../game-settings';
import { FAST_TRAVEL } from '../world-extras';
import { buildMissionBoard } from '../game-missions';
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

function HeatMeter({ snap }: { snap: HudSnapshot }) {
  const heat = snap.progress?.heatLevel ?? 0;
  if (heat < 0.35 || snap.ridingWaymo) return null;
  const pct = Math.min(100, (heat / 5) * 100);
  return (
    <div className="heat-meter" title="Speed-trap heat">
      Heat: {heatLabel(heat)} ({Math.round(pct)}%)
      <div className="heat-bar">
        <div className="heat-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MissionBoard({ snap }: { snap: HudSnapshot }) {
  if (!snap.progress || snap.photoMode || snap.ridingWaymo) return null;
  const lines = buildMissionBoard(snap.progress, snap.playerX, snap.playerZ);
  return (
    <details className="mission-panel" open>
      <summary>Missions</summary>
      <ul>
        {lines.slice(0, 10).map((m) => (
          <li key={m.id} className={m.done ? 'mission-done' : ''}>
            {m.label}
            {m.hint ? <span className="mission-hint"> — {m.hint}</span> : null}
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
    typeof window !== 'undefined' && isTouchPrimary() && !snap.photoMode && snap.phase === 'home' && !snap.ridingWaymo;

  return (
    <div className={`react-hud ${snap.photoMode ? 'photo-active' : ''}`}>
      {snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestSkipWaymo()}>
          Skip Waymo ride
        </button>
      )}
      {snap.streetName && !snap.photoMode && !snap.ridingWaymo && (
        <div className="street-blade" aria-live="polite">
          {snap.streetName}
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
      {snap.flightMode && !snap.photoMode && (
        <p className="flight-hint">Space/⤒ climb · Ctrl/⤓ sink · WASD · Shift boost</p>
      )}
      <HeatMeter snap={snap} />
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
  return (
    <div className={`touch-drive ${flight ? 'touch-flight' : ''}`} aria-label="Touch driving controls">
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
