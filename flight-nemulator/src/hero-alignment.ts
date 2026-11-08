import type { HeroSpec } from './hero-roster';
import { getPlayerRole, setPlayerRole, type PlayerRole } from './player-role';
import { isDoomGodEmperor } from './doom-story-arc';
import { isSolarCorrupted, SOLAR_HERO_ID } from './solar-lantern-arc';

export type HeroAlignment = 'hero-only' | 'villain-only' | 'dual';

export const DUAL_ROLE_HERO_ID = 'latverian-sovereign';

const ALIGNMENT_OVERRIDE: Record<string, HeroAlignment> = {
  [DUAL_ROLE_HERO_ID]: 'dual',
  'cell-mimic': 'villain-only',
  'spirit-buu': 'villain-only',
  'venom-echo': 'villain-only'
};

export function heroAlignment(spec: HeroSpec): HeroAlignment {
  return ALIGNMENT_OVERRIDE[spec.id] ?? 'hero-only';
}

export function canPickAlignment(heroId: string): boolean {
  if (heroId === DUAL_ROLE_HERO_ID && isDoomGodEmperor()) return false;
  return heroId === DUAL_ROLE_HERO_ID;
}

export function isVillainOnlyHero(heroId: string): boolean {
  return ALIGNMENT_OVERRIDE[heroId] === 'villain-only';
}

export function enforceAlignmentForHero(heroId: string): PlayerRole {
  if (heroId === DUAL_ROLE_HERO_ID && isDoomGodEmperor()) {
    setPlayerRole('villain');
    return 'villain';
  }
  if (heroId === SOLAR_HERO_ID && isSolarCorrupted()) {
    setPlayerRole('villain');
    return 'villain';
  }
  const align = ALIGNMENT_OVERRIDE[heroId] ?? 'hero-only';
  if (align === 'villain-only') {
    setPlayerRole('villain');
    return 'villain';
  }
  if (align === 'hero-only') {
    setPlayerRole('hero');
    return 'hero';
  }
  return getPlayerRole();
}
