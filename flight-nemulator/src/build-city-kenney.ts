import { Entity, type AppBase } from 'playcanvas';
import { WORLD_HALF_M } from './districts';

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
