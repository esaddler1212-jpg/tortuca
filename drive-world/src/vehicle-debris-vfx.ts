import { Entity, type AppBase } from 'playcanvas';

const DEBRIS_URLS = [
  './models/kenney/debris-tire.glb',
  './models/kenney/debris-bumper.glb',
  './models/kenney/debris-plate-a.glb',
  './models/kenney/debris-spoiler-a.glb',
  './models/kenney/debris-door.glb'
] as const;

let lastBurstAt = 0;

function loadGlb(app: AppBase, url: string): Promise<Entity | null> {
  return new Promise((resolve) => {
    app.assets.loadFromUrl(url, 'container', (err, asset) => {
      if (err || !asset?.resource) {
        resolve(null);
        return;
      }
      const resource = asset.resource as { instantiateRenderEntity?: (o?: object) => Entity };
      resolve(resource.instantiateRenderEntity?.({ castShadows: false }) ?? null);
    });
  });
}

/**
 * Scatter Kenney car-kit debris when a hard recover fires (off-road flip or manual R at speed).
 */
export async function spawnKenneyCrashDebris(
  app: AppBase,
  x: number,
  y: number,
  z: number,
  yawDeg: number
): Promise<void> {
  const now = performance.now();
  if (now - lastBurstAt < 900) return;
  lastBurstAt = now;

  const picks = [...DEBRIS_URLS].sort(() => Math.random() - 0.5).slice(0, 3);
  const yaw = (yawDeg * Math.PI) / 180;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  for (let i = 0; i < picks.length; i++) {
    const ent = await loadGlb(app, picks[i]!);
    if (!ent) continue;
    const spread = 0.6 + i * 0.35;
    const ox = (Math.random() - 0.5) * 1.2 + fx * spread;
    const oz = (Math.random() - 0.5) * 1.2 + fz * spread;
    ent.setPosition(x + ox, y + 0.15, z + oz);
    const s = 0.55 + Math.random() * 0.25;
    ent.setLocalScale(s, s, s);
    ent.setEulerAngles(0, yawDeg + (Math.random() - 0.5) * 70, (Math.random() - 0.5) * 40);
    app.root.addChild(ent);
    window.setTimeout(() => ent.destroy(), 12000);
  }
}