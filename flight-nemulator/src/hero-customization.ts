import type { HeroForm, HeroSpec } from './hero-roster';

/** Heroes with swappable ability kits (not big cosmetic libraries). */
export const ABILITY_KIT_HERO_IDS = new Set(['tin-aviator', 'red-codriver', 'shade-knight']);

export type LoadoutGroup = 'kit' | 'form';

export interface LoadoutOption {
  id: string;
  label: string;
  group: LoadoutGroup;
  color: [number, number, number];
  speedMul: number;
  powerMul: number;
  abilities: string[];
}

export function isAbilityKitHero(heroId: string): boolean {
  return ABILITY_KIT_HERO_IDS.has(heroId);
}

/** @deprecated use isAbilityKitHero */
export const isFullLoadoutHero = isAbilityKitHero;

export function listHeroLoadouts(spec: HeroSpec): LoadoutOption[] {
  return spec.forms.map((f) => ({
    id: f.id,
    label: f.label,
    group: isAbilityKitHero(spec.id) ? 'kit' : 'form',
    color: f.color,
    speedMul: f.speedMul,
    powerMul: f.powerMul,
    abilities: f.abilities ?? []
  }));
}

export function kitHudLabel(form: HeroForm): string {
  const spd = Math.round(form.speedMul * 100);
  const pwr = Math.round(form.powerMul * 100);
  const tail = form.abilities?.length ? form.abilities.join(' · ') : form.label;
  return `${form.label} · ${tail} · SPD ${spd}% · PWR ${pwr}%`;
}

export function loadoutStatsLabel(form: HeroForm): string {
  const spd = Math.round(form.speedMul * 100);
  const pwr = Math.round(form.powerMul * 100);
  return `SPD ${spd}% · PWR ${pwr}%`;
}

export function customizationBlurb(heroId: string): string | null {
  if (heroId === 'tin-aviator') return 'Swap repulsor, unibeam, missiles, and siege tools mid-flight.';
  if (heroId === 'red-codriver') return 'Shoulder cannons, miniguns, plasma, and bunker busters.';
  if (heroId === 'shade-knight') return 'Gadgets, grapples, smoke, and jet rigs — not costume closets.';
  return null;
}
