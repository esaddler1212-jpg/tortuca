import type { HeroSpec } from './hero-roster';
import { getPlayerRole, setPlayerRole, type PlayerRole } from './player-role';

export type HeroAlignment = 'hero-only' | 'villain-only' | 'dual';

export const DUAL_ROLE_HERO_ID = 'latverian-sovereign';

const ALIGNMENT_OVERRIDE: Record<string, HeroAlignment> = {
  [DUAL_ROLE_HERO_ID]: 'dual',
  'cell-mimic': 'villain-only',
  'spirit-buu': 'villain-only'
};

export function heroAlignment(spec: HeroSpec): HeroAlignment {
  return ALIGNMENT_OVERRIDE[spec.id] ?? 'hero-only';
}

export function canPickAlignment(heroId: string): boolean {
  return heroId === DUAL_ROLE_HERO_ID;
}

export function isVillainOnlyHero(heroId: string): boolean {
  return ALIGNMENT_OVERRIDE[heroId] === 'villain-only';
}

export function enforceAlignmentForHero(heroId: string): PlayerRole {
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
