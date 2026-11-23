import { Vec3, type AppBase, type Entity } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import type { CameraMode } from './game-progress';

function terrainBlocksCamLine(
  eyeX: number,
  eyeY: number,
  eyeZ: number,
  camX: number,
  camY: number,
  camZ: number
): boolean {
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = eyeX + (camX - eyeX) * t;
    const z = eyeZ + (camZ - eyeZ) * t;
    const y = eyeY + (camY - eyeY) * t;
    if (y < hillOffsetM(x, z) + 5.2) return true;
  }
  return false;
}

function isCamOccluder(entName: string, vehicleEnt: Entity | null, hitEntity: Entity | null): boolean {
  if (!entName) return false;
  if (
    entName.startsWith('ground') ||
    entName.startsWith('bay-terrain') ||
    entName.endsWith('-col') ||
    entName.includes('freeway') ||
    entName.startsWith('tokyo-ground')
  ) {
    return false;
  }
  if (!vehicleEnt || !hitEntity) return true;
  let n: Entity | null = hitEntity;
  while (n) {
    if (n === vehicleEnt) return false;
    n = n.parent as Entity | null;
  }
  return true;
}

function physicsBlocksCamLine(
  app: AppBase | null,
  vehicleEnt: Entity | null,
  eyeX: number,
  eyeY: number,
  eyeZ: number,
  camX: number,
  camY: number,
  camZ: number
): boolean {
  if (!app?.systems.rigidbody) return false;
  const from = new Vec3(eyeX, eyeY, eyeZ);
  const to = new Vec3(camX, camY, camZ);
  const hit = app.systems.rigidbody.raycastFirst(from, to);
  if (!hit) return false;
  const entName = hit.entity.name ?? '';
  if (!isCamOccluder(entName, vehicleEnt, hit.entity)) return false;
  return true;
}

export type CameraProfile = {
  offset: Vec3;
  lookAhead: number;
  lookHeight: number;
  lerp: number;
  useOrbit?: boolean;
  drone?: { height: number; back: number };
};

const profiles: Record<CameraMode, CameraProfile> = {
  chase: {
    offset: new Vec3(0, 3.2, 7.5),
    lookAhead: 12,
    lookHeight: 0.75,
    lerp: 1
  },
  hood: {
    offset: new Vec3(0, 0.85, -2.1),
    lookAhead: 28,
    lookHeight: 0.4,
    lerp: 0.85
  },
  low: {
    offset: new Vec3(0, 1.05, 9.5),
    lookAhead: 16,
    lookHeight: 0.35,
    lerp: 0.92
  },
  cinematic: {
    offset: new Vec3(3.8, 2.4, 8.2),
    lookAhead: 14,
    lookHeight: 0.55,
    lerp: 0.35
  },
  cockpit: {
    offset: new Vec3(0, 0.95, 0.15),
    lookAhead: 32,
    lookHeight: 0.35,
    lerp: 1
  },
  wide: {
    offset: new Vec3(0, 5.8, 15),
    lookAhead: 10,
    lookHeight: 0.9,
    lerp: 0.5
  },
  drone: {
    offset: new Vec3(0, 0, 0),
    lookAhead: 6,
    lookHeight: 0.6,
    lerp: 1,
    drone: { height: 24, back: 10 }
  },
  orbit: {
    offset: new Vec3(0, 4.2, 11),
    lookAhead: 4,
    lookHeight: 0.5,
    lerp: 0.25,
    useOrbit: true
  },
  vista: {
    offset: new Vec3(-6, 2.8, 4),
    lookAhead: 0,
    lookHeight: 0,
    lerp: 0.2
  }
};

let orbitAngle = 0;
const smoothPos = new Vec3();

export function cameraProfile(mode: CameraMode): CameraProfile {
  return profiles[mode] ?? profiles.chase;
}

export const CAMERA_CYCLE: CameraMode[] = [
  'chase',
  'hood',
  'low',
  'cinematic',
  'cockpit',
  'wide',
  'orbit',
  'drone'
];

export function cameraModeLabel(mode: CameraMode): string {
  const labels: Record<CameraMode, string> = {
    chase: 'Chase',
    hood: 'Hood',
    low: 'Low ride',
    cinematic: 'Cine',
    cockpit: 'Cockpit',
    wide: 'Wide',
    drone: 'Drone',
    orbit: 'Orbit',
    vista: 'Vista'
  };
  return labels[mode] ?? 'Chase';
}

/** Forza-style static look inside Vallejo estate garage bay. */
export function applyGarageInteriorCamera(
  camera: Entity,
  ent: Entity,
  estateX: number,
  estateZ: number,
  dt: number
): void {
  const pos = ent.getPosition();
  const look = new Vec3(pos.x, pos.y + 0.9, pos.z);
  const target = new Vec3(estateX - 11, hillOffsetM(estateX, estateZ) + 6.5, estateZ + 4);
  smoothPos.lerp(smoothPos, target, Math.min(1, dt * 5));
  camera.setPosition(smoothPos);
  camera.lookAt(look);
}

export function applyDriveCamera(
  camera: Entity,
  ent: Entity,
  mode: CameraMode,
  dt: number,
  vistaLook?: { x: number; y: number; z: number } | null,
  app: AppBase | null = null
): void {
  const prof = cameraProfile(mode);
  const pos = ent.getPosition();
  /** PlayCanvas `forward` is −local Z; Bullet vehicle thrust is +local Z (opposite). */
  const forward = ent.forward;
  const right = ent.right;

  if (mode === 'vista' && vistaLook) {
    const target = new Vec3(
      pos.x + prof.offset.x,
      pos.y + prof.offset.y,
      pos.z + prof.offset.z
    );
    smoothPos.lerp(smoothPos, target, Math.min(1, prof.lerp * (dt * 8 + 0.5)));
    camera.setPosition(smoothPos);
    camera.lookAt(new Vec3(vistaLook.x, vistaLook.y, vistaLook.z));
    return;
  }

  if (prof.drone) {
    const goal = new Vec3(
      pos.x + forward.x * prof.drone.back,
      pos.y + prof.drone.height,
      pos.z + forward.z * prof.drone.back
    );
    smoothPos.lerp(smoothPos, goal, Math.min(1, dt * 4.5));
    camera.setPosition(smoothPos);
    const look = new Vec3(pos.x - forward.x * 6, pos.y + 0.6, pos.z - forward.z * 6);
    camera.lookAt(look);
    return;
  }

  let off = prof.offset;
  if (prof.useOrbit) {
    orbitAngle += dt * 0.22;
    const cos = Math.cos(orbitAngle);
    const sin = Math.sin(orbitAngle);
    off = new Vec3(sin * 10, prof.offset.y, cos * 10);
  }

  let camBack = mode === 'cockpit' ? 0 : off.z;
  if (camBack > 0.5 && (mode === 'chase' || mode === 'low' || mode === 'cinematic')) {
    const eyeY = pos.y + 1.15;
    for (let pass = 0; pass < 4; pass++) {
      const tx = pos.x + forward.x * camBack + right.x * off.x;
      const ty = pos.y + off.y;
      const tz = pos.z + forward.z * camBack + right.z * off.x;
      const terrainHit = terrainBlocksCamLine(pos.x, eyeY, pos.z, tx, ty, tz);
      const physicsHit = physicsBlocksCamLine(app, ent, pos.x, eyeY, pos.z, tx, ty, tz);
      if (!terrainHit && !physicsHit) break;
      camBack *= 0.62;
    }
    camBack = Math.max(2.8, camBack);
  }
  const target = new Vec3(
    pos.x + forward.x * camBack + right.x * off.x,
    pos.y + off.y,
    pos.z + forward.z * camBack + right.z * off.x
  );
  if (prof.lerp >= 0.99) {
    camera.setPosition(target);
  } else {
    smoothPos.lerp(smoothPos, target, Math.min(1, prof.lerp * (dt * 10 + 0.4)));
    camera.setPosition(smoothPos);
  }

  const lookDist = mode === 'cockpit' ? prof.lookAhead : prof.lookAhead;
  const look = new Vec3(
    pos.x - forward.x * lookDist,
    pos.y + prof.lookHeight,
    pos.z - forward.z * lookDist
  );
  camera.lookAt(look);
}
