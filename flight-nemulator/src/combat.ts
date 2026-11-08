import { Entity, Vec3, type AppBase } from 'playcanvas';
import type { HeroSpec } from './hero-roster';
import type { DestructibleTag } from './build-city';
import { carveCrater } from './destruction';
import type { QualityTier } from './quality-tier';

export type EnemyDrone = {
  entity: Entity;
  hp: number;
  speed: number;
};

export function waveDroneCount(wave: number, wantedStars: number): number {
  return 3 + Math.min(12, wave) + wantedStars * 2;
}

export function spawnWaveDrones(app: AppBase, root: Entity, origin: Vec3, count: number): EnemyDrone[] {
  const out: EnemyDrone[] = [];
  for (let i = 0; i < count; i++) {
    const ent = new Entity(`drone-${Date.now()}-${i}`);
    const angle = (i / count) * Math.PI * 2;
    ent.setLocalPosition(origin.x + Math.cos(angle) * 80, origin.y + 40 + i * 3, origin.z + Math.sin(angle) * 80);
    ent.setLocalScale(3.5, 1.2, 3.5);
    root.addChild(ent);
    out.push({
      entity: ent,
      hp: 3 + Math.floor(count / 4),
      speed: 28 + Math.random() * 12 + count * 0.35
    });
  }
  return out;
}

export function tickDrones(drones: EnemyDrone[], heroPos: Vec3, dt: number, root: Entity): number {
  let kills = 0;
  for (let i = drones.length - 1; i >= 0; i--) {
    const d = drones[i];
    const p = d.entity.getPosition();
    const dir = new Vec3(heroPos.x - p.x, heroPos.y - p.y, heroPos.z - p.z);
    if (dir.length() > 0.01) dir.normalize();
    d.entity.setPosition(p.x + dir.x * d.speed * dt, p.y + dir.y * d.speed * dt, p.z + dir.z * d.speed * dt);
    if (d.hp <= 0) {
      root.removeChild(d.entity);
      d.entity.destroy();
      drones.splice(i, 1);
      kills++;
    }
  }
  return kills;
}

function primaryDamage(hero: HeroSpec, powerMul: number): number {
  const p = hero.powers[0];
  const base =
    p === 'repulsor'
      ? 2.2
      : p === 'thunder'
        ? 2.5
        : p === 'ki'
          ? 2.8
          : p === 'ring'
            ? 2
            : p === 'web'
              ? 1.2
              : p === 'telekinesis'
                ? 1.8
                : 1.6;
  return base * powerMul;
}

function primaryReach(hero: HeroSpec): number {
  return hero.powers.includes('web') ? 85 : hero.powers.includes('ki') ? 150 : 120;
}

export function primaryStrikeParams(hero: HeroSpec, powerMul: number): { range: number; cone: number; dmg: number } {
  const cone = hero.powers.includes('thunder') ? 42 : 25;
  return {
    range: primaryReach(hero),
    cone,
    dmg: primaryDamage(hero, powerMul)
  };
}

/** @deprecated use primaryStrikeParams + faction-npcs.damageNpcsInCone */
export function firePrimary(
  hero: HeroSpec,
  heroPos: Vec3,
  aim: Vec3,
  drones: EnemyDrone[],
  powerMul: number
): number {
  let hits = 0;
  const { range, cone, dmg } = primaryStrikeParams(hero, powerMul);
  for (const d of drones) {
    const p = d.entity.getPosition();
    const dist = new Vec3(p.x - aim.x, p.y - aim.y, p.z - aim.z).length();
    const toDrone = new Vec3(p.x - heroPos.x, p.y - heroPos.y, p.z - heroPos.z).length();
    if (toDrone < range && dist < cone) {
      d.hp -= dmg;
      hits++;
    }
  }
  return hits;
}

export function throwProp(
  tags: DestructibleTag[],
  heroPos: Vec3,
  drones: EnemyDrone[]
): number {
  let nearest: DestructibleTag | null = null;
  let nd = Infinity;
  for (const tag of tags) {
    if (!tag.intact || tag.immune) continue;
    const p = tag.entity.getPosition();
    const d = new Vec3(p.x - heroPos.x, p.y - heroPos.y, p.z - heroPos.z).length();
    if (d < 40 && d < nd) {
      nd = d;
      nearest = tag;
    }
  }
  if (!nearest) return 0;
  nearest.entity.enabled = false;
  nearest.intact = false;
  let hits = 0;
  for (const dr of drones) {
    const p = dr.entity.getPosition();
    const d = new Vec3(p.x - heroPos.x, p.y - heroPos.y, p.z - heroPos.z).length();
    if (d < 35) {
      dr.hp -= 3;
      hits++;
    }
  }
  return hits;
}

export function superCrater(
  app: AppBase,
  root: Entity,
  aim: Vec3,
  tags: DestructibleTag[],
  tier: QualityTier,
  radius: number
) {
  return carveCrater(app, root, aim, radius, tags, tier);
}
