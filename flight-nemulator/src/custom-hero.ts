import type { HeroSpec } from './hero-roster';

export type CustomHeroDraft = {
  id: string;
  codename: string;
  primaryColor: [number, number, number];
  power: 'beam' | 'ki' | 'repulsor';
  createdAt: string;
};

const LS_KEY = 'flight-nemulator-custom-heroes';

export function loadCustomHeroes(): CustomHeroDraft[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomHeroDraft[];
  } catch {
    return [];
  }
}

export function saveCustomHero(draft: CustomHeroDraft): void {
  const list = loadCustomHeroes().filter((h) => h.id !== draft.id);
  list.push(draft);
  localStorage.setItem(LS_KEY, JSON.stringify(list.slice(-20)));
}

export function customHeroToSpec(draft: CustomHeroDraft): HeroSpec {
  return {
    id: draft.id,
    codename: draft.codename,
    tagline: 'Player-crafted flier',
    districtId: 'sokovia-memorial',
    homeLabel: 'Memorial Apex',
    powers: [draft.power],
    flight: { cruiseKmh: 360, boostKmh: 2000, agility: 1.0, mass: 90 },
    energy: { staminaMax: 110, regenPerSec: 22, superCooldownSec: 20, primaryCooldownSec: 0.28 },
    smashRadius: 3.2,
    forms: [{ id: 'custom', label: 'Custom', speedMul: 1, powerMul: 1, color: draft.primaryColor }],
    defaultFormId: 'custom',
    aerial: 'tech'
  };
}
