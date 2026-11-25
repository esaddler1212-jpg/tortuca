import { BATTLEWORLD_ARCS } from './battleworld-arcs';
import { syncBattleworldChapters } from './battleworld-chapters';
import { BATTLEWORLD_SAFE_HOUSES, safeHouseWorldPos } from './battleworld-safe-houses';
import { DISTRICTS } from './districts';
import { hasArcBeat, hasDistrictSignatureBeat } from './arc-progress';
import { arcMinimapPin } from './battleworld-minimap-pins';
import type { MinimapPin } from './battleworld-minimap-pins';
import { spawnAtHome } from './districts';
import { districtIdAtPosition } from './build-city';
import type { InfinityStoneState } from './infinity-stones-arc';
import type { TerritoryState } from './territory-invasion';
import { territoryTakeoverCount } from './territory-invasion';
import type { PlayerRole } from './player-role';
import { isVillainOnlyHero } from './hero-alignment';

export type FindNextCue = {
  pin: MinimapPin;
  label: string;
};

function pinFromDistrict(districtId: string, label: string): MinimapPin {
  const d = DISTRICTS.find((x) => x.id === districtId);
  if (!d) return { x: 0, z: 0, label };
  return { x: d.center.x, z: d.center.z, label };
}

/** Gold “find next” pin — one priority objective for the minimap (Mythwild-style). */
export function findNextObjective(params: {
  heroId: string;
  role: PlayerRole;
  posX: number;
  posZ: number;
  territory: TerritoryState;
  infinity: InfinityStoneState;
}): FindNextCue | null {
  const villainOnly = isVillainOnlyHero(params.heroId);
  const chapters = syncBattleworldChapters(params.heroId, params.role, villainOnly);
  const openChapter = chapters.find((c) => !c.done);
  if (openChapter) {
    const arc = BATTLEWORLD_ARCS[params.heroId];
    const districtId = arc?.districtId ?? districtIdAtPosition(params.posX, params.posZ);
    return {
      pin: pinFromDistrict(districtId, '→'),
      label: openChapter.step.hint
    };
  }

  if (params.role === 'hero' && territoryTakeoverCount(params.territory) > 0) {
    const invaded = DISTRICTS.find((d) => {
      const row = params.territory.districts[d.id];
      return row && (row.status === 'contested' || row.status === 'raze' || row.status === 'henchmen');
    });
    if (invaded) {
      return {
        pin: pinFromDistrict(invaded.id, '→'),
        label: `Clear takeover — ${invaded.label}`
      };
    }
  }

  if (params.role === 'hero' && !hasDistrictSignatureBeat(params.heroId)) {
    const home = spawnAtHome(
      BATTLEWORLD_ARCS[params.heroId]?.districtId ??
        DISTRICTS.find((d) => d.id)?.id ??
        'metropolis'
    );
    return { pin: { x: home.x, z: home.z, label: 'H' }, label: 'Press H at home turf' };
  }

  const arcPin = arcMinimapPin(params.heroId, params.role);
  if (arcPin) {
    return { pin: { ...arcPin, label: '→' }, label: 'Arc signature district' };
  }

  const openStone = params.infinity.sites.find((s) => s.claimedBy === 'wild' || s.claimedBy === 'sealed');
  if (openStone && !hasArcBeat(params.heroId, 'stone-linked')) {
    const p = openStone.entity.getPosition();
    return {
      pin: { x: p.x, z: p.z, label: '→' },
      label: `Infinity stone — ${openStone.label}`
    };
  }

  const house = BATTLEWORLD_SAFE_HOUSES.find(
    (h) => !h.heroIds || h.heroIds.includes(params.heroId)
  );
  if (house) {
    const p = safeHouseWorldPos(house);
    return { pin: { x: p.x, z: p.z, label: 'S' }, label: `Safe house — ${house.label}` };
  }

  return null;
}