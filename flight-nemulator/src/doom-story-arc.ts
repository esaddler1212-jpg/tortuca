import type { AppBase } from 'playcanvas';
import type { Entity } from 'playcanvas';
import { DUAL_ROLE_HERO_ID } from './hero-alignment';
import type { QualityTier } from './quality-tier';
import type { FactionNpc } from './faction-npcs';
import { setPlayerRole } from './player-role';
import {
  clearHeroMonument,
  clearVillainTheme
} from './world-persist';
import { createCityIntegrity } from './city-integrity';
import { freshWantedAfterShatter, resetFateAfterAutoRoam, shatterAndRebuildEarth } from './world-reset';
import type { WorldFateState } from './world-fate';
import type { CityIntegrityState } from './city-integrity';
import type { WantedState } from './wanted';

export const DOOM_GOD_EMPEROR_FORM = 'doom-god-emperor';

const GOD_EMPEROR_KEY = 'flight-nemulator-doom-god-emperor';
const TIMELINE_GEN_KEY = 'flight-nemulator-doom-hero-timeline-gen';

export function isDoomGodEmperor(): boolean {
  return localStorage.getItem(GOD_EMPEROR_KEY) === '1';
}

export function doomHeroTimelineGeneration(): number | null {
  const raw = localStorage.getItem(TIMELINE_GEN_KEY);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function applyDoomGodEmperor(): void {
  localStorage.setItem(GOD_EMPEROR_KEY, '1');
  localStorage.setItem(`flight-nemulator-form-${DUAL_ROLE_HERO_ID}`, DOOM_GOD_EMPEROR_FORM);
  setPlayerRole('villain');
}

export function doomStoryHudLine(heroId: string, role: string): string | null {
  if (heroId !== DUAL_ROLE_HERO_ID) return null;
  if (isDoomGodEmperor()) {
    return 'God Emperor — Battleworld throne (villain ending)';
  }
  const gen = doomHeroTimelineGeneration();
  if (gen != null && role === 'hero') {
    return `Hero ending — branched to Battleworld timeline · gen ${gen}`;
  }
  if (role === 'hero') {
    return 'Hero path: win the wave-10 pair duel to branch a new timeline';
  }
  if (role === 'villain') {
    return 'Villain path: remake the dying Earth or annihilate it to become God Emperor';
  }
  return null;
}

export type DoomTimelineJump = {
  generation: number;
  city: CityIntegrityState;
  wanted: WantedState;
};

/** Hero ending: fresh Earth in a new timeline branch. */
export function doomHeroTimelineJump(
  app: AppBase,
  root: Entity,
  tier: QualityTier,
  npcs: FactionNpc[],
  fate: WorldFateState
): DoomTimelineJump {
  clearVillainTheme();
  clearHeroMonument();
  const blast = shatterAndRebuildEarth(app, root, tier, npcs, true);
  localStorage.setItem(TIMELINE_GEN_KEY, String(blast.generation));
  resetFateAfterAutoRoam(fate);
  return {
    generation: blast.generation,
    city: createCityIntegrity(),
    wanted: freshWantedAfterShatter()
  };
}
