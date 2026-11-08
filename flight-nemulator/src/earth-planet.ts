import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import { DISTRICTS, WORLD_HALF_M } from './districts';
import { attachUnitBox } from './primitive-mesh';

/** One playable Earth disk — each district is a city cell on the ring. */
export const EARTH_RING_RADIUS_M = 7200;
export const EARTH_ORBIT_MIN_ALT_M = 280;
export const EARTH_ORBIT_SPEED_KMH = 400;

let earthLayoutReady = false;

/** Spread homage cities around one planet; mutates district centers once per load. */
export function initEarthDistrictRing(): void {
  if (earthLayoutReady) return;
  const n = DISTRICTS.length;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const d = DISTRICTS[i]!;
    d.center.set(Math.cos(angle) * EARTH_RING_RADIUS_M, 0, Math.sin(angle) * EARTH_RING_RADIUS_M);
  }
  earthLayoutReady = true;
}

export function earthLabel(pos: Vec3): string {
  let best = DISTRICTS[0]!;
  let bd = Infinity;
  for (const d of DISTRICTS) {
    const dx = pos.x - d.center.x;
    const dz = pos.z - d.center.z;
    const dist = dx * dx + dz * dz;
    if (dist < bd) {
      bd = dist;
      best = d;
    }
  }
  return `Earth · ${best.label}`;
}

export function horizontalRadius(pos: Vec3): number {
  return Math.sqrt(pos.x * pos.x + pos.z * pos.z);
}

/** Ring marker + ocean tint so the world reads as one globe. */
export function buildPlanetShell(app: AppBase, root: Entity): void {
  const ring = new Entity('earth-ring');
  const segs = 64;
  const y = -8;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const x0 = Math.cos(a0) * EARTH_RING_RADIUS_M;
    const z0 = Math.sin(a0) * EARTH_RING_RADIUS_M;
    const x1 = Math.cos(a1) * EARTH_RING_RADIUS_M;
    const z1 = Math.sin(a1) * EARTH_RING_RADIUS_M;
    const seg = new Entity(`ring-seg-${i}`);
    seg.setLocalPosition((x0 + x1) / 2, y, (z0 + z1) / 2);
    const len = Math.hypot(x1 - x0, z1 - z0);
    seg.setLocalScale(len, 6, 24);
    seg.setLocalEulerAngles(0, (-a0 - a1) * (180 / Math.PI) * 0.5 + 90, 0);
    seg.addComponent('render', {
      meshInstances: [attachUnitBox(app, 0.12, 0.35, 0.55)]
    });
    ring.addChild(seg);
  }
  root.addChild(ring);

  const ocean = new Entity('earth-ocean');
  ocean.setLocalScale(WORLD_HALF_M * 2, 2, WORLD_HALF_M * 2);
  ocean.setLocalPosition(0, -12, 0);
  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.04, 0.12, 0.22);
  mat.emissive = new Color(0.02, 0.06, 0.14);
  mat.update();
  ocean.addComponent('render', { meshInstances: [attachUnitBox(app, 0.04, 0.12, 0.22)] });
  root.addChild(ocean);
}
