import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import type { DestructibleTag } from './build-city';
import { smashDestructible } from './destruction';
import type { QualityTier } from './quality-tier';
import type { PlayerRole } from './player-role';
import { applyRaiderSiege } from './city-integrity';
import type { CityIntegrityState } from './city-integrity';
import { attachUnitBox } from './primitive-mesh';
import { pickHeroInterceptor } from './hero-rivals';
import { syncFlightAssistVisuals, type AerialMobility } from './aerial-mobility';
import { pickVillainClone, type VillainCloneSpec } from './villain-roster';

export type FactionNpc = {
  entity: Entity;
  hp: number;
  maxHp?: number;
  speed: number;
  /** Villain raiders siege buildings; hero interceptors chase the player */
  allegiance: 'villain' | 'hero';
  siegeCd: number;
  targetTag?: DestructibleTag;
  profileId: string;
  codename: string;
  siegeMul: number;
  isPairBoss?: boolean;
};

export function waveNpcCount(wave: number, wantedStars: number, role: PlayerRole): number {
  const base = 3 + Math.min(10, wave);
  if (role === 'hero') return base + Math.floor(wave / 2);
  return base + wantedStars * 2;
}

function paintNpc(ent: Entity, allegiance: 'villain' | 'hero', rgb: [number, number, number]): void {
  const mi = ent.render?.meshInstances?.[0];
  const mat = mi?.material as StandardMaterial | undefined;
  if (!mat) return;
  const [r, g, b] = rgb;
  mat.diffuse = new Color(r, g, b);
  mat.emissive = new Color(r * 0.45, g * 0.45, b * 0.45);
  if (allegiance === 'hero') {
    mat.emissive = new Color(r * 0.55 + 0.05, g * 0.55 + 0.1, b * 0.55 + 0.15);
  }
  mat.update();
}

export function spawnFactionWave(
  app: AppBase,
  root: Entity,
  origin: Vec3,
  count: number,
  role: PlayerRole,
  playerHeroId: string,
  wave: number
): FactionNpc[] {
  const allegiance = role === 'hero' ? 'villain' : 'hero';
  const out: FactionNpc[] = [];
  for (let i = 0; i < count; i++) {
    let profileId = 'generic';
    let codename = allegiance === 'villain' ? 'Raider' : 'Responder';
    let color: [number, number, number] =
      allegiance === 'villain' ? [0.55, 0.12, 0.65] : [0.15, 0.35, 0.85];
    let hpMul = 1;
    let speedMul = 1;
    let siegeMul = 1;
    let scale: [number, number, number] =
      allegiance === 'villain' ? [2.8, 3.6, 2.2] : [3.5, 3.2, 2.2];

    let aerial: AerialMobility = allegiance === 'hero' ? 'native' : 'ki';
    let clone: VillainCloneSpec | undefined;
    if (allegiance === 'villain') {
      clone = pickVillainClone(playerHeroId, wave, i);
      profileId = clone.id;
      codename = clone.codename;
      color = clone.color;
      hpMul = clone.hpMul;
      speedMul = clone.speedMul;
      siegeMul = clone.siegeMul;
      scale = clone.scale;
      aerial = clone.aerial;
    } else {
      const hero = pickHeroInterceptor(playerHeroId, wave, i);
      profileId = hero.id;
      codename = hero.codename;
      color = hero.forms[0]?.color ?? [0.15, 0.35, 0.85];
      hpMul = 1.05;
      speedMul = 1.1;
      scale = [2.8, 3.4, 2.2];
      aerial = hero.aerial;
    }

    const ent = new Entity(`npc-${profileId}-${Date.now()}-${i}`);
    const angle = (i / count) * Math.PI * 2;
    const dist = role === 'hero' ? 140 + i * 8 : 80;
    ent.setLocalPosition(origin.x + Math.cos(angle) * dist, origin.y + 35 + i * 2, origin.z + Math.sin(angle) * dist);
    ent.setLocalScale(scale[0], scale[1], scale[2]);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, color[0], color[1], color[2])]
    });
    paintNpc(ent, allegiance, color);
    syncFlightAssistVisuals(app, ent, aerial, color);
    root.addChild(ent);
    const baseHp = allegiance === 'villain' ? 4 + Math.floor(count / 3) : 3 + Math.floor(count / 4);
    const baseSpeed =
      allegiance === 'villain' ? 22 + Math.random() * 10 : 28 + Math.random() * 12 + count * 0.3;
    out.push({
      entity: ent,
      hp: baseHp * hpMul,
      speed: baseSpeed * speedMul,
      allegiance,
      siegeCd: 0.4 + Math.random() * 0.6,
      profileId,
      codename,
      siegeMul
    });
  }
  return out;
}

export function nearestFoeCodename(npcs: FactionNpc[], role: PlayerRole, pos: Vec3): string | null {
  const foe = role === 'hero' ? 'villain' : 'hero';
  let best: FactionNpc | null = null;
  let bd = Infinity;
  for (const n of npcs) {
    if (n.allegiance !== foe) continue;
    const p = n.entity.getPosition();
    const d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2;
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  return best?.codename ?? null;
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
): { kills: number; defeated: { profileId: string; codename: string }[] } {
  let kills = 0;
  const defeated: { profileId: string; codename: string }[] = [];
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i]!;
    const p = n.entity.getPosition();

    if (n.allegiance === 'villain' && role === 'hero') {
      if (n.isPairBoss) {
        const dir = new Vec3(playerPos.x - p.x, playerPos.y - p.y, playerPos.z - p.z);
        if (dir.length() > 0.01) dir.normalize();
        const chase = n.speed * 1.15;
        n.entity.setPosition(p.x + dir.x * chase * dt, p.y + dir.y * chase * dt, p.z + dir.z * chase * dt);
      } else {
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
                applyRaiderSiege(city, hit.costUsd * n.siegeMul);
                n.targetTag = undefined;
              }
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
      defeated.push({ profileId: n.profileId, codename: n.codename });
      root.removeChild(n.entity);
      n.entity.destroy();
      npcs.splice(i, 1);
      kills++;
    }
  }
  return { kills, defeated };
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
