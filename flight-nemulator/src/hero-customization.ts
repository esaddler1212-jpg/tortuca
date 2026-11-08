import { resolveHeroForm } from './hero-forms';
import type { HeroForm, HeroSpec } from './hero-roster';

/** Heroes with the largest suit / color libraries in the HUD. */
export const FULL_LOADOUT_HERO_IDS = new Set(['tin-aviator', 'red-codriver', 'shade-knight']);

export type LoadoutGroup = 'suit' | 'armor' | 'cape' | 'mode';

export interface LoadoutOption {
  id: string;
  label: string;
  group: LoadoutGroup;
  color: [number, number, number];
  speedMul: number;
  powerMul: number;
}

function groupFor(spec: HeroSpec, id: string): LoadoutGroup {
  if (spec.id === 'red-codriver') return 'armor';
  if (spec.id === 'shade-knight') {
    if (id === 'tactical' || id === 'beyond-jet' || id === 'hellbat' || id === 'arkham-lift') return 'mode';
    return 'cape';
  }
  if (spec.suitVariants?.some((s) => s.id === id)) return 'suit';
  return 'mode';
}

export function isFullLoadoutHero(heroId: string): boolean {
  return FULL_LOADOUT_HERO_IDS.has(heroId);
}

export function listHeroLoadouts(spec: HeroSpec): LoadoutOption[] {
  const seen = new Set<string>();
  const out: LoadoutOption[] = [];

  const push = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const f = resolveHeroForm(spec, id);
    out.push({
      id: f.id,
      label: f.label,
      group: groupFor(spec, id),
      color: f.color,
      speedMul: f.speedMul,
      powerMul: f.powerMul
    });
  };

  for (const s of spec.suitVariants ?? []) push(s.id);
  for (const f of spec.forms) push(f.id);

  return out;
}

export function loadoutStatsLabel(form: HeroForm): string {
  const spd = Math.round(form.speedMul * 100);
  const pwr = Math.round(form.powerMul * 100);
  return `SPD ${spd}% · PWR ${pwr}%`;
}

export function customizationBlurb(heroId: string): string | null {
  if (heroId === 'tin-aviator') return 'Mk I–L armor presets, stealth, and nanite loadouts.';
  if (heroId === 'red-codriver') return 'War armor palettes, gunship, and heavy weapons kits.';
  if (heroId === 'shade-knight') return 'Capes, eras, and tactical / jet modes.';
  return null;
}
