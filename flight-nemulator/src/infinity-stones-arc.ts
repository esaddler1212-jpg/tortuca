import { Entity, Vec3, type AppBase } from 'playcanvas';
import { districtForHero } from './districts';
import { attachUnitBox } from './primitive-mesh';
import { syncFlightAssistVisuals } from './aerial-mobility';
import { getVillainClone, type VillainCloneSpec } from './villain-roster';
import { applyDoomGodEmperor, isDoomGodEmperor } from './doom-story-arc';
import { DUAL_ROLE_HERO_ID } from './hero-alignment';
import type { FactionNpc } from './faction-npcs';

export const INFINITY_STONE_TOTAL = 6;
const PLAYER_STONES_KEY = 'flight-nemulator-infinity-player-stones';
const PLAYER_ASCENDED_KEY = 'flight-nemulator-infinity-ascended';
export const HUNTER_PICKS = ['titan-snap-echo', 'trickster-prince', 'chrome-overmind'] as const;

export type StoneId =
  | 'power'
  | 'space'
  | 'reality'
  | 'soul'
  | 'time'
  | 'mind';

export type InfinityStoneSite = {
  id: StoneId;
  districtId: string;
  label: string;
  color: [number, number, number];
  entity: Entity;
  claimedBy: 'wild' | 'player' | 'hunter' | 'sealed';
  hunterId?: string;
};

export type InfinityHunterNpc = {
  hunterId: (typeof HUNTER_PICKS)[number];
  clone: VillainCloneSpec;
  entity: Entity;
  stonesHeld: number;
  ascended: boolean;
  hp: number;
  maxHp: number;
  speed: number;
};

export type InfinityStoneState = {
  sites: InfinityStoneSite[];
  hunters: InfinityHunterNpc[];
  ascendedBossSpawned: boolean;
  lastHudLine: string | null;
};

const STONE_DEFS: { id: StoneId; districtId: string; label: string; color: [number, number, number] }[] =
  [
    { id: 'power', districtId: 'stark-nexus', label: 'Power', color: [0.72, 0.12, 0.18] },
    { id: 'space', districtId: 'watchtower-annex', label: 'Space', color: [0.12, 0.22, 0.62] },
    { id: 'reality', districtId: 'sokovia-memorial', label: 'Reality', color: [0.55, 0.2, 0.72] },
    { id: 'soul', districtId: 'wakanda-gateway', label: 'Soul', color: [0.92, 0.62, 0.15] },
    { id: 'time', districtId: 'asgard-embassy', label: 'Time', color: [0.15, 0.65, 0.42] },
    { id: 'mind', districtId: 'ki-plateau', label: 'Mind', color: [0.78, 0.2, 0.2] }
  ];

export function isPlayerInfinityAscended(): boolean {
  return localStorage.getItem(PLAYER_ASCENDED_KEY) === '1' || isDoomGodEmperor();
}

export function playerInfinityStoneCount(): number {
  const raw = localStorage.getItem(PLAYER_STONES_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? Math.min(INFINITY_STONE_TOTAL, n) : 0;
}

function setPlayerStoneCount(n: number): void {
  localStorage.setItem(PLAYER_STONES_KEY, String(Math.min(INFINITY_STONE_TOTAL, Math.max(0, n))));
}

export function createInfinityStoneState(app: AppBase, root: Entity): InfinityStoneState {
  const sites: InfinityStoneSite[] = [];
  for (const def of STONE_DEFS) {
    const d = districtForHero(def.districtId);
    const ent = new Entity(`stone-${def.id}`);
    ent.setPosition(d.center.x, 72, d.center.z + 18);
    ent.setLocalScale(2.2, 2.2, 2.2);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, def.color[0], def.color[1], def.color[2])]
    });
    syncFlightAssistVisuals(app, ent, 'native', def.color);
    root.addChild(ent);
    sites.push({
      id: def.id,
      districtId: def.districtId,
      label: def.label,
      color: def.color,
      entity: ent,
      claimedBy: 'wild'
    });
  }

  const hunters: InfinityHunterNpc[] = [];
  for (let i = 0; i < HUNTER_PICKS.length; i++) {
    const hunterId = HUNTER_PICKS[i]!;
    const clone = getVillainClone(hunterId);
    if (!clone) continue;
    const d = districtForHero(STONE_DEFS[i % STONE_DEFS.length]!.districtId);
    const ent = new Entity(`hunter-${hunterId}`);
    ent.setPosition(d.center.x + 40 * (i - 1), 48, d.center.z - 50);
    ent.setLocalScale(clone.scale[0], clone.scale[1], clone.scale[2]);
    ent.addComponent('render', {
      meshInstances: [attachUnitBox(app, clone.color[0], clone.color[1], clone.color[2])]
    });
    syncFlightAssistVisuals(app, ent, clone.aerial, clone.color);
    root.addChild(ent);
    hunters.push({
      hunterId,
      clone,
      entity: ent,
      stonesHeld: 0,
      ascended: false,
      hp: 6 * clone.hpMul,
      maxHp: 6 * clone.hpMul,
      speed: 28 * clone.speedMul
    });
  }

  return { sites, hunters, ascendedBossSpawned: false, lastHudLine: null };
}

export function nearestWildStone(
  state: InfinityStoneState,
  from: Vec3
): InfinityStoneSite | null {
  let best: InfinityStoneSite | null = null;
  let bd = Infinity;
  for (const s of state.sites) {
    if (s.claimedBy !== 'wild') continue;
    const p = s.entity.getPosition();
    const d = (p.x - from.x) ** 2 + (p.z - from.z) ** 2;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

export function stoneNearPlayer(site: InfinityStoneSite, pos: Vec3, dist = 85): boolean {
  const p = site.entity.getPosition();
  const dx = p.x - pos.x;
  const dz = p.z - pos.z;
  return dx * dx + dz * dz < dist * dist;
}

export function applyPlayerInfinityAscension(heroId: string): void {
  if (heroId === DUAL_ROLE_HERO_ID) {
    applyDoomGodEmperor();
    return;
  }
  localStorage.setItem(PLAYER_ASCENDED_KEY, '1');
  setPlayerStoneCount(INFINITY_STONE_TOTAL);
}

export function infinityPowerMultiplier(heroId: string): number {
  if (!isPlayerInfinityAscended()) return 1;
  if (heroId === DUAL_ROLE_HERO_ID) return 1.42;
  return 1.32;
}

export function claimStoneForPlayer(state: InfinityStoneState, site: StoneId): boolean {
  const row = state.sites.find((s) => s.id === site);
  if (!row || row.claimedBy !== 'wild') return false;
  row.claimedBy = 'player';
  row.entity.enabled = false;
  const n = playerInfinityStoneCount() + 1;
  setPlayerStoneCount(n);
  state.lastHudLine =
    n >= INFINITY_STONE_TOTAL
      ? 'All six Infinity Stones — Battleworld God Emperor ascension!'
      : `Infinity Stone (${row.label}) secured — ${n}/${INFINITY_STONE_TOTAL}`;
  return true;
}

export function denyStoneForHero(state: InfinityStoneState, site: StoneId): boolean {
  const row = state.sites.find((s) => s.id === site);
  if (!row || row.claimedBy !== 'wild') return false;
  row.claimedBy = 'sealed';
  row.entity.enabled = false;
  state.lastHudLine = `${row.label} Stone sealed — Thanos, Loki, and Ultron cannot claim it`;
  return true;
}

export function hunterClaimsStone(state: InfinityStoneState, hunter: InfinityHunterNpc, site: InfinityStoneSite): void {
  site.claimedBy = 'hunter';
  site.hunterId = hunter.hunterId;
  site.entity.enabled = false;
  hunter.stonesHeld += 1;
  state.lastHudLine = `${hunter.clone.codename} took the ${site.label} Stone (${hunter.stonesHeld}/${INFINITY_STONE_TOTAL})`;
}

export function spawnAscendedHunterBoss(
  app: AppBase,
  root: Entity,
  hunter: InfinityHunterNpc
): FactionNpc {
  hunter.ascended = true;
  const scale = hunter.clone.scale.map((s) => s * 1.85) as [number, number, number];
  hunter.entity.setLocalScale(scale[0], scale[1], scale[2]);
  const hp = 22 * hunter.clone.hpMul * 8;
  hunter.hp = hp;
  hunter.maxHp = hp;
  hunter.speed *= 1.2;
  return {
    entity: hunter.entity,
    hp,
    maxHp: hp,
    speed: hunter.speed,
    allegiance: 'villain',
    siegeCd: 0.6,
    profileId: hunter.clone.id,
    codename: `God Emperor ${hunter.clone.codename}`,
    siegeMul: hunter.clone.siegeMul * 1.5,
    isPairBoss: true
  };
}

export function infinityBossBlocksFinale(npcs: FactionNpc[]): boolean {
  return npcs.some((n) => n.codename.startsWith('God Emperor'));
}

export function resetInfinityHunt(state: InfinityStoneState, app: AppBase, root: Entity): void {
  for (const s of state.sites) {
    root.removeChild(s.entity);
    s.entity.destroy();
  }
  for (const h of state.hunters) {
    if (!h.entity.parent) continue;
    root.removeChild(h.entity);
    h.entity.destroy();
  }
  const fresh = createInfinityStoneState(app, root);
  state.sites = fresh.sites;
  state.hunters = fresh.hunters;
  state.ascendedBossSpawned = false;
  state.lastHudLine = 'Infinity hunt reset — stones scattered again';
  setPlayerStoneCount(0);
  localStorage.removeItem(PLAYER_ASCENDED_KEY);
}

export function infinityStonesHudLine(
  state: InfinityStoneState,
  role: string,
  heroId: string
): string | null {
  if (state.lastHudLine && state.lastHudLine.length < 120) return state.lastHudLine;
  const wild = state.sites.filter((s) => s.claimedBy === 'wild').length;
  const hunterBits = state.hunters
    .map((h) => `${h.clone.codename.split(' ')[0]} ${h.stonesHeld}/${INFINITY_STONE_TOTAL}`)
    .join(' · ');
  const player = playerInfinityStoneCount();
  if (role === 'hero') {
    return `Infinity hunt — ${wild} stones left · ${hunterBits} (stop them before 6)`;
  }
  if (isPlayerInfinityAscended()) {
    return heroId === DUAL_ROLE_HERO_ID
      ? 'God Emperor — Infinity + Battleworld throne'
      : 'Infinity ascended — godlike villain havoc';
  }
  return `Stone chase — you ${player}/${INFINITY_STONE_TOTAL} · ${hunterBits}`;
}
