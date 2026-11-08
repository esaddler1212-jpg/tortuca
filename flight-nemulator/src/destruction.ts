import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import type { DestructibleTag } from './build-city';
import { attachUnitBox } from './primitive-mesh';
import { debrisEnabled, type QualityTier } from './quality-tier';

export type DestroyResult = { costUsd: number; count: number };

const debris: { ent: Entity; vy: number; life: number }[] = [];

function makeDebris(app: AppBase, root: Entity, pos: Vec3, size: number, color: Color): void {
  const n = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const ent = new Entity('debris');
    const s = size * (0.15 + Math.random() * 0.25);
    ent.setLocalPosition(pos.x + (Math.random() - 0.5) * size, pos.y + Math.random() * size * 0.5, pos.z + (Math.random() - 0.5) * size);
    ent.setLocalScale(s, s * 0.6, s);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, color.r, color.g, color.b)]
    });
    root.addChild(ent);
    debris.push({ ent, vy: 2 + Math.random() * 4, life: 3 + Math.random() * 2 });
  }
}

export function tickDebris(dt: number, root: Entity): void {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.life -= dt;
    d.vy -= 9.8 * dt;
    const p = d.ent.getPosition();
    d.ent.setPosition(p.x, p.y + d.vy * dt, p.z);
    if (d.life <= 0 || p.y < -5) {
      root.removeChild(d.ent);
      d.ent.destroy();
      debris.splice(i, 1);
    }
  }
}

export function smashDestructible(
  app: AppBase,
  root: Entity,
  tag: DestructibleTag,
  tier: QualityTier,
  impact: Vec3
): DestroyResult | null {
  if (!tag.intact) return null;
  tag.intact = false;
  const cost = tag.costUsd;
  tag.entity.enabled = false;
  if (debrisEnabled(tier)) {
    const col = tag.entity.render?.meshInstances?.[0]?.material as StandardMaterial | undefined;
    const c = col?.diffuse ?? new Color(0.4, 0.4, 0.45);
    makeDebris(app, root, impact, Math.max(tag.w, tag.d), c);
  }
  return { costUsd: cost, count: 1 };
}

export function checkHeroSmash(
  app: AppBase,
  root: Entity,
  heroPos: Vec3,
  speedKmh: number,
  radius: number,
  tags: DestructibleTag[],
  tier: QualityTier
): DestroyResult {
  let total = 0;
  let count = 0;
  if (speedKmh < 80) return { costUsd: 0, count: 0 };
  const r2 = radius * radius;
  for (const tag of tags) {
    if (!tag.intact) continue;
    const p = tag.entity.getPosition();
    const dx = p.x - heroPos.x;
    const dy = p.y - heroPos.y;
    const dz = p.z - heroPos.z;
    if (dx * dx + dy * dy + dz * dz > r2 + tag.w * tag.w) continue;
    const hit = smashDestructible(app, root, tag, tier, new Vec3(p.x, p.y, p.z));
    if (hit) {
      total += hit.costUsd;
      count += hit.count;
    }
  }
  return { costUsd: total, count };
}

export function carveCrater(
  app: AppBase,
  root: Entity,
  aim: Vec3,
  radius: number,
  tags: DestructibleTag[],
  tier: QualityTier
): DestroyResult {
  let total = 0;
  let count = 0;
  const r2 = radius * radius;
  for (const tag of tags) {
    if (!tag.intact) continue;
    const p = tag.entity.getPosition();
    const dx = p.x - aim.x;
    const dz = p.z - aim.z;
    if (dx * dx + dz * dz > r2 + tag.w * tag.w * 0.5) continue;
    const hit = smashDestructible(app, root, tag, tier, aim);
    if (hit) {
      total += hit.costUsd;
      count += hit.count;
    }
  }
  return { costUsd: total, count };
}
