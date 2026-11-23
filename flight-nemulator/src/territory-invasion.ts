import { Entity, Vec3, type AppBase } from 'playcanvas';
import { districtIdAtPosition, type DestructibleTag } from './build-city';
import { districtForHero } from './districts';
import { DISTRICTS, type DistrictSpec } from './districts';
import { getHero, HERO_ROSTER, type HeroSpec } from './hero-roster';
import { attachUnitBox } from './primitive-mesh';
import { syncFlightAssistVisuals } from './aerial-mobility';
import {
  getVillainClone,
  pickVillainClone,
  VILLAIN_CLONES,
  type VillainCloneSpec
} from './villain-roster';
import type { FactionNpc } from './faction-npcs';
import { pickHeroDefenderForDistrict } from './hero-rivals';

export const DEFENDER_PRESSURE_USD = 120_000;

export type DistrictTerritoryStatus =
  | 'neutral'
  | 'contested'
  | 'held_choice'
  | 'raze'
  | 'henchmen';

export type DistrictTerritory = {
  status: DistrictTerritoryStatus;
  pressureUsd: number;
  defendersSpawned: boolean;
};

export type VillainAdvisorNpc = {
  entity: Entity;
  clone: VillainCloneSpec;
};

export type TerritoryState = {
  districts: Record<string, DistrictTerritory>;
  advisors: VillainAdvisorNpc[];
  lastHint: string | null;
  occupantSpawnCd: number;
};

export function createTerritoryState(): TerritoryState {
  const districts: Record<string, DistrictTerritory> = {};
  for (const d of DISTRICTS) {
    districts[d.id] = { status: 'neutral', pressureUsd: 0, defendersSpawned: false };
  }
  return { districts: districts, advisors: [], lastHint: null, occupantSpawnCd: 0 };
}

export function heroesInDistrict(districtId: string): HeroSpec[] {
  return HERO_ROSTER.filter((h) => h.districtId === districtId);
}

export function districtLabel(districtId: string): string {
  return DISTRICTS.find((d) => d.id === districtId)?.label ?? districtId;
}

export function addDistrictDestruction(
  state: TerritoryState,
  districtId: string | null,
  costUsd: number,
  villainHomeDistrictId: string
): string | null {
  if (!districtId || districtId === villainHomeDistrictId) return null;
  const row = state.districts[districtId];
  if (!row || row.status !== 'neutral' && row.status !== 'contested') return districtId;
  row.pressureUsd += costUsd;
  if (row.status === 'neutral' && row.pressureUsd >= DEFENDER_PRESSURE_USD) {
    row.status = 'contested';
    row.defendersSpawned = false;
  }
  return districtId;
}

export function territoryTakeoverCount(state: TerritoryState): number {
  let n = 0;
  for (const row of Object.values(state.districts)) {
    if (row.status === 'raze' || row.status === 'henchmen' || row.status === 'held_choice') n++;
  }
  return n;
}

export function canHeroFacePairBoss(state: TerritoryState): boolean {
  return territoryTakeoverCount(state) === 0;
}

export function districtRow(state: TerritoryState, districtId: string): DistrictTerritory {
  return state.districts[districtId] ?? { status: 'neutral', pressureUsd: 0, defendersSpawned: false };
}

function districtSpec(id: string): DistrictSpec {
  return districtForHero(id);
}

export function spawnDistrictDefenders(
  app: AppBase,
  root: Entity,
  districtId: string,
  playerHeroId: string,
  wave: number
): FactionNpc[] {
  const d = districtSpec(districtId);
  const origin = new Vec3(d.center.x, 42, d.center.z);
  const count = 2 + Math.min(2, heroesInDistrict(districtId).length);
  const out: FactionNpc[] = [];
  for (let i = 0; i < count; i++) {
    const hero = pickHeroDefenderForDistrict(districtId, wave, i, playerHeroId);
    const color = hero.forms[0]?.color ?? [0.15, 0.35, 0.85];
    const ent = new Entity(`defender-${hero.id}-${i}`);
    const angle = (i / count) * Math.PI * 2;
    ent.setLocalPosition(
      origin.x + Math.cos(angle) * 70,
      origin.y + 30 + i * 3,
      origin.z + Math.sin(angle) * 70
    );
    ent.setLocalScale(2.9, 3.3, 2.2);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, color[0], color[1], color[2])]
    });
    syncFlightAssistVisuals(app, ent, hero.aerial, color);
    root.addChild(ent);
    out.push({
      entity: ent,
      hp: 5.5,
      maxHp: 5.5,
      speed: 32 + i * 2,
      allegiance: 'hero',
      siegeCd: 0.5,
      profileId: hero.id,
      codename: hero.codename,
      siegeMul: 1,
      districtId,
      isDistrictDefender: true
    });
  }
  return out;
}

export function spawnHenchmenInDistrict(
  app: AppBase,
  root: Entity,
  districtId: string,
  playerHeroId: string,
  wave: number,
  count: number
): FactionNpc[] {
  const d = districtSpec(districtId);
  const origin = new Vec3(d.center.x, 38, d.center.z);
  const out: FactionNpc[] = [];
  for (let i = 0; i < count; i++) {
    const clone = pickVillainClone(playerHeroId, wave + i, i);
    const ent = new Entity(`hench-${clone.id}-${Date.now()}-${i}`);
    ent.setLocalPosition(origin.x + (i - 1) * 45, origin.y, origin.z + 50);
    ent.setLocalScale(2.4, 3, 2);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, clone.color[0], clone.color[1], clone.color[2])]
    });
    syncFlightAssistVisuals(app, ent, clone.aerial, clone.color);
    root.addChild(ent);
    out.push({
      entity: ent,
      hp: 3.5 * clone.hpMul,
      speed: (20 + Math.random() * 8) * clone.speedMul * 0.85,
      allegiance: 'villain',
      siegeCd: 0.5 + Math.random() * 0.3,
      profileId: clone.id,
      codename: `${clone.codename} lackey`,
      siegeMul: clone.siegeMul * 0.7,
      districtId,
      isHenchman: true
    });
  }
  return out;
}

const ADVISOR_PICKS = ['trickster-prince', 'laughing-harlequin', 'goblin-glider', 'deathstroke-arc'] as const;

export function spawnVillainAdvisors(app: AppBase, root: Entity): VillainAdvisorNpc[] {
  const out: VillainAdvisorNpc[] = [];
  for (let i = 0; i < ADVISOR_PICKS.length; i++) {
    const id = ADVISOR_PICKS[i]!;
    const clone = getVillainClone(id);
    if (!clone) continue;
    const d = DISTRICTS[(i * 2 + 1) % DISTRICTS.length]!;
    const ent = new Entity(`advisor-${id}`);
    ent.setLocalPosition(d.center.x + 90, 55, d.center.z - 60);
    ent.setLocalScale(2.6, 3.2, 2.3);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, clone.color[0], clone.color[1], clone.color[2])]
    });
    syncFlightAssistVisuals(app, ent, clone.aerial, clone.color);
    root.addChild(ent);
    out.push({ entity: ent, clone });
  }
  return out;
}

export function nearVillainAdvisor(advisors: VillainAdvisorNpc[], pos: Vec3, dist = 95): VillainAdvisorNpc | null {
  let best: VillainAdvisorNpc | null = null;
  let bd = dist * dist;
  for (const a of advisors) {
    const p = a.entity.getPosition();
    const dx = p.x - pos.x;
    const dz = p.z - pos.z;
    const d = dx * dx + dz * dz;
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

export function villainAdvisorHint(advisor: VillainCloneSpec): string {
  const pairHeroId = advisor.rivalHeroIds[0];
  const pairHero = pairHeroId ? getHero(pairHeroId) : null;
  const where = pairHero ? `${districtLabel(pairHero.districtId)} (${pairHero.homeLabel})` : 'their home district';
  const pairName = pairHero?.codename ?? 'their rival hero';
  const tips = [
    'Drain stamina with rush-down, then heavy super.',
    'Break line-of-sight on rooftops — interceptors hate vertical play.',
    'Save supers for when district defenders group up.',
    'Trigger wanted heat in waves so responders come one pod at a time.'
  ];
  const tip = tips[advisor.id.length % tips.length];
  return `${advisor.codename}: hunt ${pairName} at ${where}. Tip — ${tip}`;
}

export function pairHeroHintForPlayerVillain(playerHeroId: string): string | null {
  const clones = VILLAIN_CLONES.filter((v) => v.rivalHeroIds.includes(playerHeroId));
  const clone = clones[0];
  if (!clone) return null;
  const pair = getHero(clone.rivalHeroIds.find((id) => id !== playerHeroId) ?? clone.rivalHeroIds[0] ?? '');
  if (!pair) return null;
  return `Your pair rival ${pair.codename} anchors ${districtLabel(pair.districtId)} — clear districts before the finale.`;
}

export function districtDefendersAlive(npcs: FactionNpc[], districtId: string): number {
  return npcs.filter((n) => n.isDistrictDefender && n.districtId === districtId).length;
}

export function henchmenInDistrict(npcs: FactionNpc[], districtId: string): number {
  return npcs.filter((n) => n.isHenchman && n.districtId === districtId).length;
}

export function reclaimDistrict(state: TerritoryState, districtId: string): void {
  const row = state.districts[districtId];
  if (!row) return;
  row.status = 'neutral';
  row.pressureUsd = 0;
  row.defendersSpawned = false;
}

export function tryReclaimDistrict(
  state: TerritoryState,
  districtId: string,
  npcs: FactionNpc[]
): boolean {
  const row = state.districts[districtId];
  if (!row || row.status !== 'henchmen') return false;
  if (henchmenInDistrict(npcs, districtId) > 0) return false;
  reclaimDistrict(state, districtId);
  return true;
}

export function territoryHudLine(
  state: TerritoryState,
  role: string,
  districtId: string | null,
  playerHomeId: string
): string | null {
  if (!districtId) return null;
  const row = districtRow(state, districtId);
  if (role === 'villain') {
    if (row.status === 'contested') return `${districtLabel(districtId)} — heroes responding!`;
    if (row.status === 'held_choice') return `${districtLabel(districtId)} secured — H: henchmen · G: raze the skyline`;
    if (row.status === 'henchmen') return `${districtLabel(districtId)} — henchmen holding block`;
    if (row.status === 'raze') return `${districtLabel(districtId)} — marked for annihilation`;
    if (districtId !== playerHomeId && row.pressureUsd > 20_000) {
      const pct = Math.min(100, Math.round((row.pressureUsd / DEFENDER_PRESSURE_USD) * 100));
      return `Incursion heat ${pct}% in ${districtLabel(districtId)}`;
    }
  }
  if (role === 'hero') {
    const take = territoryTakeoverCount(state);
    if (take > 0 && !canHeroFacePairBoss(state)) {
      return `Villain takeover ×${take} — reclaim districts before wave-10 pair boss`;
    }
    if (row.status === 'henchmen' || row.status === 'raze') {
      return `TAKEOVER: ${districtLabel(districtId)} — stop henchmen`;
    }
  }
  return null;
}

export function markTerritoryRaze(state: TerritoryState, districtId: string): void {
  const row = state.districts[districtId];
  if (!row || row.status !== 'held_choice') return;
  row.status = 'raze';
}

export function markTerritoryHenchmen(state: TerritoryState, districtId: string): void {
  const row = state.districts[districtId];
  if (!row || row.status !== 'held_choice') return;
  row.status = 'henchmen';
}

function siegeTargetInDistrict(tags: DestructibleTag[], from: Vec3, districtId: string): DestructibleTag | null {
  let best: DestructibleTag | null = null;
  let bd = Infinity;
  for (const t of tags) {
    if (!t.intact || t.immune) continue;
    const p = t.entity.getPosition();
    if (districtIdAtPosition(p.x, p.z) !== districtId) continue;
    const d = (p.x - from.x) ** 2 + (p.z - from.z) ** 2;
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

export { siegeTargetInDistrict };
