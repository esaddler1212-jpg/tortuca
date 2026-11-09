import { Vec3 } from 'playcanvas';
import {
  EARTH_ORBIT_MIN_ALT_M,
  EARTH_ORBIT_SPEED_KMH,
  EARTH_RING_RADIUS_M,
  horizontalRadius
} from './earth-planet';

export type ChronoState = {
  /** 0–1 lap around the planet at orbit speed */
  orbitProgress: number;
  /** Time dilation active — drones and waves pause */
  chronoFrozen: boolean;
  /** Full lap complete — press Super to shatter Earth */
  chronoArmed: boolean;
  orbitActive: boolean;
  timeScale: number;
};

const state: ChronoState = {
  orbitProgress: 0,
  chronoFrozen: false,
  chronoArmed: false,
  orbitActive: false,
  timeScale: 1
};

let lastAngle = 0;
let angleInit = false;

export function getChronoState(): Readonly<ChronoState> {
  return state;
}

export function resetChronoAfterWorldShatter(): void {
  state.orbitProgress = 0;
  state.chronoFrozen = false;
  state.chronoArmed = false;
  state.orbitActive = false;
  state.timeScale = 1;
  angleInit = false;
}

export function tickEarthOrbit(pos: Vec3, speedKmh: number, dt: number): ChronoState {
  const alt = pos.y;
  const r = horizontalRadius(pos);
  const inRingBand = Math.abs(r - EARTH_RING_RADIUS_M) < 2200;
  const fast = speedKmh >= EARTH_ORBIT_SPEED_KMH;
  const high = alt >= EARTH_ORBIT_MIN_ALT_M;

  state.orbitActive = fast && high && inRingBand;

  if (!state.chronoArmed && state.orbitActive) {
    const angle = Math.atan2(pos.z, pos.x);
    if (!angleInit) {
      lastAngle = angle;
      angleInit = true;
    } else {
      let delta = angle - lastAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const lapRate = Math.abs(delta) / (Math.PI * 2);
      const speedMul = Math.min(2.2, speedKmh / EARTH_ORBIT_SPEED_KMH);
      state.orbitProgress = Math.min(1, state.orbitProgress + lapRate * speedMul * dt * 0.85);
      lastAngle = angle;
    }
  } else if (!state.orbitActive && !state.chronoArmed) {
    angleInit = false;
    state.orbitProgress = Math.max(0, state.orbitProgress - dt * 0.08);
  }

  if (state.orbitProgress >= 1 && !state.chronoArmed) {
    state.chronoArmed = true;
    state.chronoFrozen = true;
  }

  if (state.chronoFrozen || state.chronoArmed) {
    state.timeScale = 0.06;
  } else {
    state.timeScale = 1;
  }

  return state;
}
