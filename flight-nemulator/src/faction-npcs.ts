import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import type { DestructibleTag } from './build-city';
import { smashDestructible } from './destruction';
import type { QualityTier } from './quality-tier';
import type { PlayerRole } from './player-role';
import { applyRaiderSiege } from './city-integrity';
import type { CityIntegrityState } from './city-integrity';
import { attachUnitBox } from './primitive-mesh';

export type FactionNpc = {
  entity: Entity;
  hp: number;
  speed: number;
  /** Villain raiders siege buildings; hero interceptors chase the player */
  allegiance: 'villain' | 'hero';
  siegeCd: number;
  targetTag?: DestructibleTag;
};

export function waveNpcCount(wave: number, wantedStars: number, role: PlayerRole): number {
  const base = 3 + Math.min(10, wave);
  if (role === 'hero') return base + Math.floor(wave / 2);
  return base + wantedStars * 2;
}

function paintNpc(ent: Entity, allegiance: 'villain' | 'hero'): void {
  const mi = ent.render?.meshInstances?.[0];
  const mat = mi?.material as StandardMaterial | undefined;
  if (!mat) return;
  if (allegiance === 'villain') {
    mat.diffuse = new Color(0.55, 0.12, 0.65);
    mat.emissive = new Color(0.35, 0.05, 0.4);
  } else {
    mat.diffuse = new Color(0.15, 0.35, 0.85);
    mat.emissive = new Color(0.2, 0.45, 0.95);
  }
  mat.update();
}

export function spawnFactionWave(
  app: AppBase,
  root: Entity,
  origin: Vec3,
  count: number,
  role: PlayerRole
): FactionNpc[] {
  const allegiance = role === 'hero' ? 'villain' : 'hero';
  const out: FactionNpc[] = [];
  for (let i = 0; i < count; i++) {
    const ent = new Entity(`npc-${allegiance}-${Date.now()}-${i}`);
    const angle = (i / count) * Math.PI * 2;
    const dist = role === 'hero' ? 140 + i * 8 : 80;
    ent.setLocalPosition(origin.x + Math.cos(angle) * dist, origin.y + 35 + i * 2, origin.z + Math.sin(angle) * dist);
    const scale = allegiance === 'villain' ? [2.8, 3.6, 2.2] : [3.5, 1.2, 3.5];
    ent.setLocalScale(scale[0], scale[1], scale[2]);
    ent.addComponent('render', {
      meshInstances: [
        attachUnitBox(
          app,
          allegiance === 'villain' ? 0.55 : 0.15,
          allegiance === 'villain' ? 0.12 : 0.35,
          allegiance === 'villain' ? 0.65 : 0.85
        )
      ]
    });
    paintNpc(ent, allegiance);
    root.addChild(ent);
    out.push({
      entity: ent,
      hp: allegiance === 'villain' ? 4 + Math.floor(count / 3) : 3 + Math.floor(count / 4),
      speed: allegiance === 'villain' ? 22 + Math.random() * 10 : 28 + Math.random() * 12 + count * 0.3,
      allegiance,
      siegeCd: 0.4 + Math.random() * 0.6
    });
  }
  return out;
}

function nearestSiegeTarget(tags: DestructibleTag[], from: Vec3): DestructibleTag | null {
  let best: DestructibleTag | null = null;
  let bd = Infinity;
  for (const t of tags) {
    if (!t.intact || t.immune) continue;
    const p = t.entity.getPosition();
    const d = (p.x - from.x) ** 2 + (p.z - from.z) ** 2;
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

export function tickFactionNpcs(
  npcs: FactionNpc[],
  playerPos: Vec3,
  dt: number,
  root: Entity,
  role: PlayerRole,
  tags: DestructibleTag[],
  tier: QualityTier,
  city: CityIntegrityState,
  app: AppBase
): number {
  let kills = 0;
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i]!;
    const p = n.entity.getPosition();

    if (n.allegiance === 'villain' && role === 'hero') {
      if (!n.targetTag || !n.targetTag.intact) {
        n.targetTag = nearestSiegeTarget(tags, p) ?? undefined;
      }
      const target = n.targetTag;
      if (target) {
        const tp = target.entity.getPosition();
        const dir = new Vec3(tp.x - p.x, tp.y + target.h * 0.3 - p.y, tp.z - p.z);
        const len = dir.length();
        if (len > 2) {
          dir.normalize();
          n.entity.setPosition(p.x + dir.x * n.speed * dt, p.y + dir.y * n.speed * dt, p.z + dir.z * n.speed * dt);
        } else {
          n.siegeCd -= dt;
          if (n.siegeCd <= 0) {
            n.siegeCd = 0.9 + Math.random() * 0.4;
            const hit = smashDestructible(app, root, target, tier, tp);
            if (hit) {
              applyRaiderSiege(city, hit.costUsd);
              n.targetTag = undefined;
            }
          }
        }
      }
    } else if (n.allegiance === 'hero' && role === 'villain') {
      const dir = new Vec3(playerPos.x - p.x, playerPos.y - p.y, playerPos.z - p.z);
      if (dir.length() > 0.01) dir.normalize();
      n.entity.setPosition(p.x + dir.x * n.speed * dt, p.y + dir.y * n.speed * dt, p.z + dir.z * n.speed * dt);
    }

    if (n.hp <= 0) {
      root.removeChild(n.entity);
      n.entity.destroy();
      npcs.splice(i, 1);
      kills++;
    }
  }
  return kills;
}

export function damageNpcsInCone(
  heroPos: Vec3,
  aim: Vec3,
  npcs: FactionNpc[],
  role: PlayerRole,
  range: number,
  cone: number,
  dmg: number
): number {
  const foe = role === 'hero' ? 'villain' : 'hero';
  let hits = 0;
  for (const n of npcs) {
    if (n.allegiance !== foe) continue;
    const p = n.entity.getPosition();
    const dist = new Vec3(p.x - aim.x, p.y - aim.y, p.z - aim.z).length();
    const toNpc = new Vec3(p.x - heroPos.x, p.y - heroPos.y, p.z - heroPos.z).length();
    if (toNpc < range && dist < cone) {
      n.hp -= dmg;
      hits++;
    }
  }
  return hits;
}

export function throwHitsNpcs(heroPos: Vec3, npcs: FactionNpc[], role: PlayerRole): number {
  const foe = role === 'hero' ? 'villain' : 'hero';
  let hits = 0;
  for (const n of npcs) {
    if (n.allegiance !== foe) continue;
    const p = n.entity.getPosition();
    const d = new Vec3(p.x - heroPos.x, p.y - heroPos.y, p.z - heroPos.z).length();
    if (d < 38) {
      n.hp -= 3;
      hits++;
    }
  }
  return hits;
}
