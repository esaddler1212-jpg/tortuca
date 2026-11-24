import { Entity, type AppBase } from 'playcanvas';
import { DISTRICTS, WORLD_HALF_M } from './districts';

type KenneyIndex = { files: string[] };

function hash2(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

async function loadKenneyIndex(): Promise<KenneyIndex | null> {
  try {
    const res = await fetch('./models/kenney-city/index.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    return (await res.json()) as KenneyIndex;
  } catch {
    return null;
  }
}

function loadGlb(app: AppBase, url: string): Promise<Entity | null> {
  return new Promise((resolve) => {
    app.assets.loadFromUrl(url, 'container', (err, asset) => {
      if (err || !asset?.resource) {
        resolve(null);
        return;
      }
      const resource = asset.resource as { instantiateRenderEntity?: (o?: object) => Entity };
      const ent = resource.instantiateRenderEntity?.({ castShadows: true, receiveShadows: true });
      resolve(ent ?? null);
    });
  });
}

/** Sprinkle CC0 Kenney buildings when install script populated kenney-city/. */
export async function placeKenneyLandmarks(app: AppBase, root: Entity, maxCount: number): Promise<number> {
  const index = await loadKenneyIndex();
  if (!index?.files?.length) return 0;

  const files = index.files.slice(0, 32);
  let placed = 0;
  const step = 220;

  for (let x = -WORLD_HALF_M + step; x < WORLD_HALF_M && placed < maxCount; x += step) {
    for (let z = -WORLD_HALF_M + step; z < WORLD_HALF_M && placed < maxCount; z += step) {
      if (hash2(x, z) < 0.7) continue;
      const file = files[Math.floor(hash2(z, x) * files.length)]!;
      const url = `./models/kenney-city/${file}`;
      const ent = await loadGlb(app, url);
      if (!ent) continue;
      const scale = 2.5 + hash2(x + z, x - z) * 2;
      ent.setLocalPosition(x, 0, z);
      ent.setLocalScale(scale, scale, scale);
      ent.setLocalEulerAngles(0, hash2(x, z) * 360, 0);
      root.addChild(ent);
      placed++;
    }
  }
  return placed;
}

type DistrictSlot = { dx: number; dz: number; scale: number; yaw: number; fileIdx: number };

const SKYLINE_RING: DistrictSlot[] = [
  { dx: 180, dz: 120, scale: 3.2, yaw: -20, fileIdx: 0 },
  { dx: -160, dz: 140, scale: 2.9, yaw: 35, fileIdx: 1 },
  { dx: 140, dz: -150, scale: 3.0, yaw: 110, fileIdx: 2 },
  { dx: -170, dz: -130, scale: 2.8, yaw: -95, fileIdx: 3 }
];

/** Four Kenney silhouettes per district center when CC0 pack is installed (slice 2 skyline read). */
export async function placeDistrictKenneySkyline(app: AppBase, root: Entity): Promise<number> {
  const index = await loadKenneyIndex();
  if (!index?.files?.length) return 0;
  const files = index.files;
  let placed = 0;

  for (const d of DISTRICTS) {
    const group = new Entity(`kenney-skyline-${d.id}`);
    root.addChild(group);
    for (const slot of SKYLINE_RING) {
      const file = files[slot.fileIdx % files.length]!;
      const url = `./models/kenney-city/${file}`;
      const ent = await loadGlb(app, url);
      if (!ent) continue;
      ent.setLocalPosition(d.center.x + slot.dx, 0, d.center.z + slot.dz);
      ent.setLocalScale(slot.scale, slot.scale * d.skylineMul, slot.scale);
      ent.setLocalEulerAngles(0, slot.yaw, 0);
      group.addChild(ent);
      placed++;
    }
  }
  return placed;
}
