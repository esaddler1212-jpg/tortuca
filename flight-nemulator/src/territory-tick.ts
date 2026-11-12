import type { Vec3 } from 'playcanvas';
import type { AppBase } from 'playcanvas';
import type { Entity } from 'playcanvas';
import { districtIdAtPosition } from './build-city';
import { addVillainHavoc, type CityIntegrityState } from './city-integrity';
import type { FactionNpc } from './faction-npcs';
import type { PlayerRole } from './player-role';
import { playWaveAlert } from './game-audio';
import {
  districtDefendersAlive,
  districtRow,
  henchmenInDistrict,
  markTerritoryHenchmen,
  markTerritoryRaze,
  reclaimDistrict,
  spawnDistrictDefenders,
  spawnHenchmenInDistrict,
  tryReclaimDistrict,
  type TerritoryState
} from './territory-invasion';

export function applyTerritoryHenchmenChoice(
  state: TerritoryState,
  districtId: string,
  app: AppBase,
  root: Entity,
  npcs: FactionNpc[],
  playerHeroId: string,
  wave: number
): void {
  const row = districtRow(state, districtId);
  if (row.status !== 'held_choice') return;
  markTerritoryHenchmen(state, districtId);
  npcs.push(...spawnHenchmenInDistrict(app, root, districtId, playerHeroId, wave, 3));
  playWaveAlert();
}

export function applyTerritoryRazeChoice(
  state: TerritoryState,
  districtId: string,
  city: CityIntegrityState
): void {
  const row = districtRow(state, districtId);
  if (row.status !== 'held_choice') return;
  markTerritoryRaze(state, districtId);
  addVillainHavoc(city, 1_200_000);
  playWaveAlert();
}

export function tickTerritoryInvasion(
  state: TerritoryState,
  npcs: FactionNpc[],
  app: AppBase,
  root: Entity,
  pos: Vec3,
  dt: number,
  role: PlayerRole,
  playerHeroId: string,
  wave: number,
  city: CityIntegrityState
): void {
  for (const d of Object.keys(state.districts)) {
    const row = state.districts[d]!;
    if (row.status === 'contested' && !row.defendersSpawned) {
      row.defendersSpawned = true;
      npcs.push(...spawnDistrictDefenders(app, root, d, playerHeroId, wave));
      playWaveAlert();
    }
    if (
      row.status === 'contested' &&
      row.defendersSpawned &&
      districtDefendersAlive(npcs, d) === 0
    ) {
      row.status = 'held_choice';
    }
  }

  const here = districtIdAtPosition(pos.x, pos.z);

  if (role === 'villain') {
    for (const [id, row] of Object.entries(state.districts)) {
      if (row.status === 'henchmen' && henchmenInDistrict(npcs, id) < 2) {
        state.occupantSpawnCd -= dt;
        if (state.occupantSpawnCd <= 0) {
          state.occupantSpawnCd = 16;
          npcs.push(...spawnHenchmenInDistrict(app, root, id, playerHeroId, wave, 2));
        }
      }
      if (row.status === 'raze') {
        addVillainHavoc(city, 55_000 * dt);
      }
    }
  }

  if (role === 'hero') {
    state.occupantSpawnCd -= dt;
    for (const [id, row] of Object.entries(state.districts)) {
      if (
        (row.status === 'henchmen' || row.status === 'raze') &&
        henchmenInDistrict(npcs, id) < 3 &&
        state.occupantSpawnCd <= 0
      ) {
        state.occupantSpawnCd = 20;
        npcs.push(...spawnHenchmenInDistrict(app, root, id, playerHeroId, wave, 2));
        break;
      }
    }
    if (here) tryReclaimDistrict(state, here, npcs);
  }
}

export function heroReclaimRazeDistrict(state: TerritoryState, districtId: string): boolean {
  const row = districtRow(state, districtId);
  if (row.status !== 'raze') return false;
  reclaimDistrict(state, districtId);
  return true;
}
