import { DUAL_ROLE_HERO_ID } from './hero-alignment';
import { DOOM_GOD_EMPEROR_FORM, isDoomGodEmperor } from './doom-story-arc';
import type { HeroForm, HeroSpec, SuitRole } from './hero-roster';
import { heroFormsForPlay } from './hero-roster';

/** Heroes with combined suit + ability loadouts. */
export const ABILITY_KIT_HERO_IDS = new Set(['tin-aviator', 'red-codriver', 'shade-knight']);

export type LoadoutGroup = SuitRole | 'form' | 'kit';

export interface LoadoutOption {
  id: string;
  label: string;
  group: LoadoutGroup;
  color: [number, number, number];
  speedMul: number;
  powerMul: number;
  abilities: string[];
  suitRole?: SuitRole;
}

const ROLE_LABEL: Record<SuitRole, string> = {
  swift: 'Swift flight',
  siege: 'Siege power',
  bulwark: 'Bulwark resilience',
  balanced: 'Balanced'
};

export function isAbilityKitHero(heroId: string): boolean {
  return ABILITY_KIT_HERO_IDS.has(heroId);
}

/** @deprecated use isAbilityKitHero */
export const isFullLoadoutHero = isAbilityKitHero;

export function listHeroLoadouts(spec: HeroSpec): LoadoutOption[] {
  const forms = heroFormsForPlay(spec).filter(
    (f) =>
      spec.id !== DUAL_ROLE_HERO_ID || f.id !== DOOM_GOD_EMPEROR_FORM || isDoomGodEmperor()
  );
  return forms.map((f) => ({
    id: f.id,
    label: f.label,
    group: (f.suitRole ?? (isAbilityKitHero(spec.id) ? 'kit' : 'form')) as LoadoutGroup,
    color: f.color,
    speedMul: f.speedMul,
    powerMul: f.powerMul,
    abilities: f.abilities ?? [],
    suitRole: f.suitRole
  }));
}

export function suitRoleLabel(role: SuitRole | undefined): string {
  return role ? ROLE_LABEL[role] : 'Loadout';
}

export function kitHudLabel(form: HeroForm): string {
  const spd = Math.round(form.speedMul * 100);
  const pwr = Math.round(form.powerMul * 100);
  const role = form.suitRole ? ROLE_LABEL[form.suitRole] : '';
  const tail = form.abilities?.length ? form.abilities.join(' · ') : form.label;
  const prefix = role ? `${role} · ` : '';
  return `${form.label} · ${prefix}${tail} · SPD ${spd}% · PWR ${pwr}%`;
}

export function loadoutStatsLabel(form: HeroForm): string {
  const spd = Math.round(form.speedMul * 100);
  const pwr = Math.round(form.powerMul * 100);
  const res = form.resilienceMul ? ` · RES ${Math.round(form.resilienceMul * 100)}%` : '';
  return `SPD ${spd}% · PWR ${pwr}%${res}`;
}

export function customizationBlurb(heroId: string): string | null {
  if (heroId === 'tin-aviator') {
    return 'Pick a suit — each paint job bundles different abilities and flight vs. power vs. armor.';
  }
  if (heroId === 'red-codriver') return 'Armor liveries with heavy, fast, or tank loadouts.';
  if (heroId === 'shade-knight') return 'Capes, jets, and armor sets — gadget kits per silhouette.';
  return null;
}
