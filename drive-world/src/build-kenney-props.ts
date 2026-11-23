import { Entity, type AppBase } from 'playcanvas';

import { streetDeckY } from './street-utils';

export type KenneyIndex = { files: string[] };

export type KenneySlot = { dx: number; dz: number; scale: number; yaw: number; fileIdx: number };

export async function loadKenneyIndex(): Promise<KenneyIndex | null> {
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

/** Place Kenney GLBs around a center when `kenney-city/` is installed locally. */
export async function placeKenneySlots(
  app: AppBase,
  centerX: number,
  centerZ: number,
  rootName: string,
  slots: KenneySlot[]
): Promise<number> {
  const index = await loadKenneyIndex();
  if (!index?.files?.length) return 0;

  const root = new Entity(rootName);
  app.root.addChild(root);

  let placed = 0;
  for (const slot of slots) {
    const file = index.files[slot.fileIdx % index.files.length];
    if (!file) continue;
    const ent = await loadGlb(app, `./models/kenney-city/${file}`);
    if (!ent) continue;
    const px = centerX + slot.dx;
    const pz = centerZ + slot.dz;
    ent.setLocalPosition(px, streetDeckY(px, pz), pz);
    ent.setLocalScale(slot.scale, slot.scale, slot.scale);
    ent.setLocalEulerAngles(0, slot.yaw, 0);
    root.addChild(ent);
    placed++;
  }
  return placed;
}