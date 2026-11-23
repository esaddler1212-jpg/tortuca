import { Entity, Vec3, type AppBase } from 'playcanvas';
import { districtForHero } from './districts';
import { attachUnitBox } from './primitive-mesh';
import { syncFlightAssistVisuals } from './aerial-mobility';
import { setPlayerRole } from './player-role';
import type { FactionNpc } from './faction-npcs';

const AID_KEY = 'flight-nemulator-solar-lantern-aid';
const CORRUPT_KEY = 'flight-nemulator-solar-corrupted';
const KEEPER_DEAD_KEY = 'flight-nemulator-lantern-keeper-dead';

export const SOLAR_HERO_ID = 'solar-apex';
export const LANTERN_SAFE_DIST = 220;

export type LanternKeeper = {
  entity: Entity;
  hp: number;
  maxHp: number;
};

export function isSolarCorrupted(): boolean {
  return localStorage.getItem(CORRUPT_KEY) === '1';
}

export function lanternAidForFinalBoss(): boolean {
  return localStorage.getItem(AID_KEY) === '1';
}

export function lanternKeeperSlain(): boolean {
  return localStorage.getItem(KEEPER_DEAD_KEY) === '1' || isSolarCorrupted();
}

export function markLanternAid(): void {
  localStorage.setItem(AID_KEY, '1');
}

export function applySolarCorruption(): void {
  localStorage.setItem(CORRUPT_KEY, '1');
  localStorage.setItem(KEEPER_DEAD_KEY, '1');
  localStorage.removeItem(AID_KEY);
  localStorage.setItem(`flight-nemulator-form-${SOLAR_HERO_ID}`, 'yellow-ring');
  setPlayerRole('villain');
}

export function lanternSafeHousePos(): Vec3 {
  const d = districtForHero('coast-city');
  return new Vec3(d.center.x, 85, d.center.z);
}

export function nearLanternSafeHouse(heroPos: Vec3): boolean {
  const s = lanternSafeHousePos();
  const dx = heroPos.x - s.x;
  const dz = heroPos.z - s.z;
  return dx * dx + dz * dz < LANTERN_SAFE_DIST * LANTERN_SAFE_DIST;
}

export function spawnLanternKeeper(app: AppBase, root: Entity): LanternKeeper {
  const pos = lanternSafeHousePos();
  const color: [number, number, number] = [0.06, 0.55, 0.25];
  const ent = new Entity('lantern-keeper');
  ent.setPosition(pos.x, pos.y, pos.z);
  ent.setLocalScale(2.6, 3.4, 2.4);
  ent.addComponent('render', {
    meshInstances: [attachUnitBox(app, color[0], color[1], color[2])]
  });
  syncFlightAssistVisuals(app, ent, 'ring', color);
  root.addChild(ent);
  return { entity: ent, hp: 18, maxHp: 18 };
}

export function spawnLanternAlly(app: AppBase, root: Entity, origin: Vec3): FactionNpc {
  const color: [number, number, number] = [0.06, 0.55, 0.25];
  const ent = new Entity('lantern-ally');
  ent.setLocalPosition(origin.x + 60, origin.y + 40, origin.z - 40);
  ent.setLocalScale(2.8, 3.2, 2.3);
  ent.addComponent('render', {
    meshInstances: [attachUnitBox(app, color[0], color[1], color[2])]
  });
  syncFlightAssistVisuals(app, ent, 'ring', color);
  root.addChild(ent);
  return {
    entity: ent,
    hp: 40,
    maxHp: 40,
    speed: 42,
    allegiance: 'hero',
    siegeCd: 0.3,
    profileId: 'emerald-pilot',
    codename: 'Emerald Pilot',
    siegeMul: 1,
    isLanternAlly: true
  };
}

export function lanternArcHudLine(
  near: boolean,
  aid: boolean,
  corrupted: boolean
): string | null {
  if (corrupted) return 'Fear ring — you are a villain';
  if (aid) return 'Emerald Pilot pledged aid for the final duel';
  if (near) return 'Coast Lantern safe house — ask for aid (H) or strike the keeper';
  return null;
}
