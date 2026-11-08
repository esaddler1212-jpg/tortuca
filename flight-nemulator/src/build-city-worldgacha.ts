import { Entity, type AppBase } from 'playcanvas';

export type WorldGachaIndex = {
  files?: string[];
  centerpiece?: string;
  scale?: number;
  offset?: [number, number, number];
  yRotation?: number;
};

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

async function loadIndex(): Promise<WorldGachaIndex | null> {
  try {
    const res = await fetch('./models/worldgacha/index.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    return (await res.json()) as WorldGachaIndex;
  } catch {
    return null;
  }
}

function placeEntity(
  ent: Entity,
  root: Entity,
  x: number,
  y: number,
  z: number,
  scale: number,
  yRot: number
): void {
  ent.setLocalPosition(x, y, z);
  ent.setLocalScale(scale, scale, scale);
  ent.setLocalEulerAngles(0, yRot, 0);
  root.addChild(ent);
}

/**
 * Oyasumi World Gacha exports (GLB) — see docs/WORLDGACHA_WORKFLOW.md.
 * Use in your game; do not redistribute raw GLBs as asset packs (tool terms).
 */
export async function placeWorldGachaTowns(
  app: AppBase,
  root: Entity,
  maxSatellites: number
): Promise<number> {
  const index = await loadIndex();
  if (!index) return 0;

  let placed = 0;
  const baseScale = index.scale ?? 1;

  const centerpiece = index.centerpiece?.trim();
  if (centerpiece) {
    const url = `./models/worldgacha/${centerpiece}`;
    const ent = await loadGlb(app, url);
    if (ent) {
      const [x, y, z] = index.offset ?? [420, 0, -320];
      placeEntity(ent, root, x, y, z, baseScale, index.yRotation ?? 0);
      placed++;
    }
  }

  const files = index.files ?? [];
  const slots: [number, number, number][] = [
    [-380, 0, 260],
    [120, 0, 480],
    [-520, 0, -140]
  ];

  for (let i = 0; i < Math.min(files.length, maxSatellites); i++) {
    const file = files[i]!;
    const ent = await loadGlb(app, `./models/worldgacha/${file}`);
    if (!ent) continue;
    const [x, y, z] = slots[i] ?? [i * 200, 0, -i * 180];
    const scale = baseScale * (0.85 + i * 0.05);
    placeEntity(ent, root, x, y, z, scale, (i + 1) * 47);
    placed++;
  }

  return placed;
}
