import { Entity, type AppBase } from 'playcanvas';

import { VALLEJO_SAFEHOUSE } from './landmark-registry';
import { streetDeckY } from './street-utils';

type KenneyIndex = { files: string[] };

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

const VALLEJO_OFFSETS: Array<{ dx: number; dz: number; scale: number; yaw: number; fileIdx: number }> = [
  { dx: -72, dz: -48, scale: 2.8, yaw: 12, fileIdx: 0 },
  { dx: 68, dz: -42, scale: 3.1, yaw: -18, fileIdx: 1 },
  { dx: -58, dz: 62, scale: 2.6, yaw: 90, fileIdx: 2 },
  { dx: 55, dz: 58, scale: 2.4, yaw: -75, fileIdx: 3 }
];

/** Optional CC0 Kenney blocks around Vallejo estate (`install-free-packs.sh --city-glb` for drive-world). */
export async function placeVallejoKenneyProps(app: AppBase): Promise<number> {
  const index = await loadKenneyIndex();
  if (!index?.files?.length) return 0;

  const root = new Entity('vallejo-kenney-props');
  app.root.addChild(root);
  const sx = VALLEJO_SAFEHOUSE.x;
  const sz = VALLEJO_SAFEHOUSE.z;

  let placed = 0;
  for (const slot of VALLEJO_OFFSETS) {
    const file = index.files[slot.fileIdx % index.files.length];
    if (!file) continue;
    const ent = await loadGlb(app, `./models/kenney-city/${file}`);
    if (!ent) continue;
    const px = sx + slot.dx;
    const pz = sz + slot.dz;
    ent.setLocalPosition(px, streetDeckY(px, pz), pz);
    ent.setLocalScale(slot.scale, slot.scale, slot.scale);
    ent.setLocalEulerAngles(0, slot.yaw, 0);
    root.addChild(ent);
    placed++;
  }
  return placed;
}