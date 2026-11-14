import { Vec3, type Entity } from 'playcanvas';

export type PhotoKeys = {
  fwd: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type PhotoOrbitState = {
  yawDeg: number;
  pitchDeg: number;
  radiusM: number;
};

export type PhotoCamera = {
  active: boolean;
  pos: Vec3;
  orbit: PhotoOrbitState;
  exposure: number;
  toggle(): boolean;
  setOrbitTarget(anchor: Vec3): void;
  clearOrbitTarget(): void;
  setExposure(value: number): void;
  move(dt: number, sens: number, keys: PhotoKeys): void;
  applyTo(camera: Entity): void;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function orbitPosition(anchor: Vec3, orbit: PhotoOrbitState): Vec3 {
  const yaw = (orbit.yawDeg * Math.PI) / 180;
  const pitch = (orbit.pitchDeg * Math.PI) / 180;
  const r = orbit.radiusM;
  const horiz = Math.cos(pitch) * r;
  return new Vec3(
    anchor.x + Math.sin(yaw) * horiz,
    anchor.y + Math.sin(pitch) * r + 1.2,
    anchor.z + Math.cos(yaw) * horiz
  );
}

export function createPhotoCamera(start: Vec3): PhotoCamera {
  const state = {
    active: false,
    pos: start.clone(),
    orbitAnchor: null as Vec3 | null,
    orbit: { yawDeg: 35, pitchDeg: 12, radiusM: 14 },
    exposure: 0.55
  };

  return {
    get active() {
      return state.active;
    },
    pos: state.pos,
    get orbit() {
      return { ...state.orbit };
    },
    get exposure() {
      return state.exposure;
    },
    toggle() {
      state.active = !state.active;
      if (!state.active) state.orbitAnchor = null;
      return state.active;
    },
    setOrbitTarget(anchor: Vec3) {
      state.orbitAnchor = anchor.clone();
      state.pos.copy(orbitPosition(state.orbitAnchor, state.orbit));
    },
    clearOrbitTarget() {
      state.orbitAnchor = null;
    },
    setExposure(value: number) {
      state.exposure = clamp(value, 0.22, 1.05);
    },
    move(dt, sens, keys) {
      if (!state.active) return;
      const rate = 55 * dt * sens;
      if (state.orbitAnchor) {
        if (keys.left) state.orbit.yawDeg -= rate * 1.4;
        if (keys.right) state.orbit.yawDeg += rate * 1.4;
        if (keys.fwd) state.orbit.pitchDeg = clamp(state.orbit.pitchDeg + rate * 0.9, -8, 52);
        if (keys.back) state.orbit.pitchDeg = clamp(state.orbit.pitchDeg - rate * 0.9, -8, 52);
        if (keys.up) state.orbit.radiusM = clamp(state.orbit.radiusM - rate * 0.35, 6, 42);
        if (keys.down) state.orbit.radiusM = clamp(state.orbit.radiusM + rate * 0.35, 6, 42);
        state.pos.copy(orbitPosition(state.orbitAnchor, state.orbit));
        return;
      }
      const speed = 45 * dt * sens;
      const yawRad = (state.orbit.yawDeg * Math.PI) / 180;
      const fx = Math.sin(yawRad);
      const fz = Math.cos(yawRad);
      if (keys.fwd) {
        state.pos.x += fx * speed;
        state.pos.z += fz * speed;
      }
      if (keys.back) {
        state.pos.x -= fx * speed;
        state.pos.z -= fz * speed;
      }
      if (keys.left) {
        state.pos.x -= fz * speed;
        state.pos.z += fx * speed;
      }
      if (keys.right) {
        state.pos.x += fz * speed;
        state.pos.z -= fx * speed;
      }
      if (keys.up) state.pos.y += speed;
      if (keys.down) state.pos.y -= speed;
    },
    applyTo(camera: Entity) {
      if (state.orbitAnchor) {
        const look = state.orbitAnchor.clone();
        look.y += 1.1;
        camera.setPosition(state.pos);
        camera.lookAt(look);
        return;
      }
      camera.setPosition(state.pos);
      const yawRad = (state.orbit.yawDeg * Math.PI) / 180;
      const pitchRad = (state.orbit.pitchDeg * Math.PI) / 180;
      const look = new Vec3(
        state.pos.x + Math.sin(yawRad) * Math.cos(pitchRad) * 30,
        state.pos.y + Math.sin(pitchRad) * 30,
        state.pos.z + Math.cos(yawRad) * Math.cos(pitchRad) * 30
      );
      camera.lookAt(look);
    }
  };
}