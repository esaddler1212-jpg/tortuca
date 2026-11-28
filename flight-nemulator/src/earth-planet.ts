import { BLEND_NORMAL, Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import { battleworldDistrictLabel } from './battleworld';
import { DISTRICT_UNIVERSE, UNIVERSE_RIM_RGB } from './battleworld-districts';
import { DISTRICTS, WORLD_HALF_M } from './districts';
import { districtGlobePosition, GLOBE_RADIUS_M, isGlobeMode } from './globe-coords';
import { attachUnitBox } from './primitive-mesh';

/** One playable Battleworld disk — nine homage city cells on a ring (Marvel / DC / DBZ). */
export const EARTH_RING_RADIUS_M = 7200;
export const EARTH_ORBIT_MIN_ALT_M = 280;
export const EARTH_ORBIT_SPEED_KMH = 400;

let earthLayoutReady = false;

/** Spread homage cities around one planet; mutates district centers once per load. */
export function initEarthDistrictRing(): void {
  if (earthLayoutReady) return;
  const n = DISTRICTS.length;
  for (let i = 0; i < n; i++) {
    const d = DISTRICTS[i]!;
    if (isGlobeMode()) {
      d.center.copy(districtGlobePosition(i, n));
    } else {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      d.center.set(Math.cos(angle) * EARTH_RING_RADIUS_M, 0, Math.sin(angle) * EARTH_RING_RADIUS_M);
    }
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
  return battleworldDistrictLabel(best.label);
}

export function horizontalRadius(pos: Vec3): number {
  return Math.sqrt(pos.x * pos.x + pos.z * pos.z);
}

/** Ring marker + ocean tint so the world reads as one globe. */
export function buildPlanetShell(app: AppBase, root: Entity): void {
  if (isGlobeMode()) {
    const body = new Entity('battleworld-globe');
    body.setLocalScale(GLOBE_RADIUS_M * 2, GLOBE_RADIUS_M * 2, GLOBE_RADIUS_M * 2);
    const mat = new StandardMaterial();
    mat.diffuse = new Color(0.06, 0.1, 0.16);
    mat.emissive = new Color(0.03, 0.06, 0.12);
    mat.emissiveIntensity = 0.35;
    mat.opacity = 0.92;
    mat.blendType = BLEND_NORMAL;
    mat.update();
    body.addComponent('render', { type: 'sphere', material: mat });
    root.addChild(body);
    for (let i = 0; i < DISTRICTS.length; i++) {
      const d = DISTRICTS[i]!;
      const beacon = new Entity(`globe-city-${d.id}`);
      beacon.setPosition(d.center);
      const [r, g, b] = d.accent;
      const bmat = new StandardMaterial();
      bmat.emissive = new Color(r * 0.7, g * 0.7, b * 0.7);
      bmat.emissiveIntensity = 1.4;
      bmat.update();
      beacon.setLocalScale(120, 120, 120);
      beacon.addComponent('render', { type: 'sphere', material: bmat });
      root.addChild(beacon);
    }
    return;
  }

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
    const districtIdx = Math.floor((i / segs) * DISTRICTS.length) % DISTRICTS.length;
    const district = DISTRICTS[districtIdx]!;
    const universe = DISTRICT_UNIVERSE[district.id] ?? 'marvel';
    const [r, g, b] = UNIVERSE_RIM_RGB[universe];
    const seg = new Entity(`ring-seg-${i}`);
    seg.setLocalPosition((x0 + x1) / 2, y, (z0 + z1) / 2);
    const len = Math.hypot(x1 - x0, z1 - z0);
    seg.setLocalScale(len, 6, 24);
    seg.setLocalEulerAngles(0, (-a0 - a1) * (180 / Math.PI) * 0.5 + 90, 0);
    seg.addComponent('render', {
      meshInstances: [attachUnitBox(app, r, g, b)]
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
