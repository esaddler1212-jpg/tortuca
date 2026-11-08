import { useEffect, useState } from 'react';

import {
  getHudSnapshot,
  requestSkipWaymo,
  requestToggleCamera,
  setTouchDrive,
  subscribeHud,
  type HudSnapshot
} from '../game-bridge';
import { DISTRICT_LABELS, LANDMARKS, districtLandmarkTotal, districtLandmarksVisited } from '../landmark-registry';
import { bearingDeg } from '../landmark-navigation';
import type { DistrictId } from '../world-config';
import { Minimap } from './Minimap';

function NavHint({ snap }: { snap: HudSnapshot }) {
  const next = snap.nextLandmark;
  if (!next || snap.ridingWaymo) return null;
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

function TouchControls({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

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

export function HudApp() {
  const [snap, setSnap] = useState<HudSnapshot>(getHudSnapshot());

  useEffect(() => subscribeHud(setSnap), []);

  const showTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  return (
    <div className="react-hud">
      {snap.ridingWaymo && (
        <button type="button" className="skip-waymo" onClick={() => requestSkipWaymo()}>
          Skip Waymo ride
        </button>
      )}
      <div className="hud-toolbar">
        <button type="button" className="cam-toggle" onClick={() => requestToggleCamera()}>
          Camera: {snap.cameraMode === 'cockpit' ? 'Cockpit' : 'Chase'} (C)
        </button>
        <span className="hud-mph">{Math.round(snap.mph)} mph</span>
      </div>
      <Minimap snap={snap} />
      <NavHint snap={snap} />
      <LandmarkPanel snap={snap} />
      <TouchControls enabled={showTouch && !snap.ridingWaymo && snap.phase === 'home'} />
    </div>
  );
}
