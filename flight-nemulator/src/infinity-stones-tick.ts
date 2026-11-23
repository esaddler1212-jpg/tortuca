import { Vec3, type AppBase, type Entity } from 'playcanvas';
import type { FactionNpc } from './faction-npcs';
import type { PlayerRole } from './player-role';
import { playWaveAlert } from './game-audio';
import {
  applyPlayerInfinityAscension,
  claimStoneForPlayer,
  denyStoneForHero,
  hunterClaimsStone,
  INFINITY_STONE_TOTAL,
  nearestWildStone,
  playerInfinityStoneCount,
  spawnAscendedHunterBoss,
  stoneNearPlayer,
  type InfinityStoneState
} from './infinity-stones-arc';

const STONE_GRAB_DIST = 42;

export function tickInfinityStonePhase(
  state: InfinityStoneState,
  dt: number,
  factionNpcs: FactionNpc[],
  app: AppBase,
  root: Entity
): void {
  for (const hunter of state.hunters) {
    if (hunter.ascended || hunter.stonesHeld >= INFINITY_STONE_TOTAL) continue;
    const stone = nearestWildStone(state, hunter.entity.getPosition());
    if (!stone) continue;
    const p = hunter.entity.getPosition();
    const target = stone.entity.getPosition();
    const dir = new Vec3(target.x - p.x, target.y - p.y, target.z - p.z);
    const len = dir.length();
    if (len < STONE_GRAB_DIST) {
      hunterClaimsStone(state, hunter, stone);
      continue;
    }
    if (len > 0.01) {
      dir.normalize();
      hunter.entity.setPosition(
        p.x + dir.x * hunter.speed * dt,
        p.y + dir.y * hunter.speed * dt * 0.35,
        p.z + dir.z * hunter.speed * dt
      );
    }
  }

  if (state.ascendedBossSpawned) return;
  const ready = state.hunters.find((h) => h.stonesHeld >= INFINITY_STONE_TOTAL && !h.ascended);
  if (!ready) return;
  state.ascendedBossSpawned = true;
  factionNpcs.push(spawnAscendedHunterBoss(app, root, ready));
  state.lastHudLine = `God Emperor ${ready.clone.codename} — full Infinity set!`;
  playWaveAlert();
}

export function tryInteractInfinityStone(
  state: InfinityStoneState,
  pos: Vec3,
  role: PlayerRole,
  heroId: string
): boolean {
  for (const site of state.sites) {
    if (site.claimedBy !== 'wild' || !stoneNearPlayer(site, pos)) continue;
    if (role === 'hero') {
      return denyStoneForHero(state, site.id);
    }
    if (!claimStoneForPlayer(state, site.id)) return false;
    if (playerInfinityStoneCount() >= INFINITY_STONE_TOTAL) {
      applyPlayerInfinityAscension(heroId);
      playWaveAlert();
    }
    return true;
  }
  return false;
}
