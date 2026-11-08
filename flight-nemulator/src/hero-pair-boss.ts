import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import type { FactionNpc } from './faction-npcs';
import { attachUnitBox } from './primitive-mesh';
import { syncFlightAssistVisuals } from './aerial-mobility';
import { getVillainClone, VILLAIN_CLONES, type VillainCloneSpec } from './villain-roster';

/** Wave when the hero's scripted pair rival arrives (hero role only). */
export const PAIR_BOSS_WAVE = 10;

/** Boss HP multiplier on top of villain clone tuning. */
const PAIR_BOSS_HP_SCALE = 14;

const PAIR_VILLAIN_ID: Record<string, string> = {
  'tin-aviator': 'doctor-doom',
  'red-codriver': 'brute-abom',
  'shade-knight': 'laughing-harlequin'
};

export function pairVillainForHero(heroId: string): VillainCloneSpec {
  const pinned = PAIR_VILLAIN_ID[heroId];
  if (pinned) {
    const v = getVillainClone(pinned);
    if (v) return v;
  }
  const rivals = VILLAIN_CLONES.filter((v) => v.rivalHeroIds.includes(heroId));
  return rivals[0] ?? VILLAIN_CLONES[0]!;
}

export function pairVillainCodename(heroId: string): string {
  return pairVillainForHero(heroId).codename;
}

function paintBoss(ent: Entity, rgb: [number, number, number]): void {
  const mi = ent.render?.meshInstances?.[0];
  const mat = mi?.material as StandardMaterial | undefined;
  if (!mat) return;
  const [r, g, b] = rgb;
  mat.diffuse = new Color(r, g, b);
  mat.emissive = new Color(r * 0.65 + 0.08, g * 0.3, b * 0.35);
  mat.update();
}

export function spawnPairBoss(
  app: AppBase,
  root: Entity,
  origin: Vec3,
  playerHeroId: string
): FactionNpc {
  const clone = pairVillainForHero(playerHeroId);
  const color = clone.color;
  const scale = clone.scale.map((s) => s * 1.35) as [number, number, number];
  const ent = new Entity(`pair-boss-${clone.id}`);
  const spawn = new Vec3(origin.x + 120, origin.y + 55, origin.z + 80);
  ent.setLocalPosition(spawn.x, spawn.y, spawn.z);
  ent.setLocalScale(scale[0], scale[1], scale[2]);
  ent.addComponent('render', {
    meshInstances: [attachUnitBox(app, color[0], color[1], color[2])]
  });
  paintBoss(ent, color);
  syncFlightAssistVisuals(app, ent, clone.aerial, color);
  root.addChild(ent);
  const baseHp = 5 * clone.hpMul * PAIR_BOSS_HP_SCALE;
  return {
    entity: ent,
    hp: baseHp,
    maxHp: baseHp,
    speed: (36 + Math.random() * 8) * clone.speedMul,
    allegiance: 'villain',
    siegeCd: 0,
    profileId: clone.id,
    codename: clone.codename,
    siegeMul: clone.siegeMul,
    isPairBoss: true
  };
}

export function pairBossHpPercent(npc: FactionNpc | undefined): number | null {
  if (!npc?.isPairBoss || !npc.maxHp) return null;
  return Math.max(0, Math.min(100, Math.round((npc.hp / npc.maxHp) * 100)));
}
