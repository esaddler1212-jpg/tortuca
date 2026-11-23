import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import type { FactionNpc } from './faction-npcs';
import { attachUnitBox } from './primitive-mesh';
import { syncFlightAssistVisuals } from './aerial-mobility';
import { getHero, type HeroSpec } from './hero-roster';

export const VILLAIN_APEX_WAVE = 10;
const VILLAIN_APEX_HP_SCALE = 11;

/** Villain-only playable legends face a hero interceptor apex instead of pair boss. */
const VILLAIN_APEX_HERO_PIN: Record<string, string> = {
  'venom-echo': 'wall-crawler',
  'cell-mimic': 'hybrid-warden',
  'spirit-buu': 'ki-wanderer'
};

export function villainApexHeroFor(heroId: string): HeroSpec {
  const pin = VILLAIN_APEX_HERO_PIN[heroId];
  return getHero(pin ?? 'solar-apex') ?? getHero('solar-apex')!;
}

export function villainApexCodename(heroId: string): string {
  return villainApexHeroFor(heroId).codename;
}

export function spawnVillainApexInterceptor(
  app: AppBase,
  root: Entity,
  origin: Vec3,
  playerVillainId: string
): FactionNpc {
  const hero = villainApexHeroFor(playerVillainId);
  const color = hero.forms[0]?.color ?? [0.2, 0.4, 0.85];
  const ent = new Entity(`villain-apex-${hero.id}`);
  const spawn = new Vec3(origin.x + 95, origin.y + 48, origin.z + 70);
  ent.setLocalPosition(spawn.x, spawn.y, spawn.z);
  ent.setLocalScale(3.2, 3.8, 2.6);
  ent.addComponent('render', {
    meshInstances: [attachUnitBox(app, color[0], color[1], color[2])]
  });
  const mi = ent.render?.meshInstances?.[0];
  const mat = mi?.material as StandardMaterial | undefined;
  if (mat) {
    mat.emissive = new Color(color[0] * 0.5, color[1] * 0.35, color[2] * 0.4);
    mat.update();
  }
  syncFlightAssistVisuals(app, ent, hero.aerial, color);
  root.addChild(ent);
  const hp = 420 * VILLAIN_APEX_HP_SCALE;
  return {
    entity: ent,
    hp,
    maxHp: hp,
    speed: hero.flight.cruiseKmh * 0.08,
    allegiance: 'hero',
    siegeCd: 0,
    profileId: hero.id,
    codename: `${hero.codename} (apex)`,
    siegeMul: 1.15,
    isPairBoss: true
  };
}
