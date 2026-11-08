import type { HeroForm } from './hero-roster';

const STORAGE_KEY = 'flight-nemulator-symbiote-unlocked';
const PREY = new Set(['venom-echo', 'carnage-echo']);

export const SYMBIOTE_FORM: HeroForm = {
  id: 'symbiote-merged',
  label: 'Symbiote — merged suit',
  suitRole: 'siege',
  abilities: ['Lashing tendrils', 'Monster smash'],
  kitPrimary: 'web',
  dmgMul: 1.38,
  speedMul: 1.14,
  powerMul: 1.28,
  primaryCdMul: 0.9,
  color: [0.07, 0.1, 0.08]
};

export function symbiotePreyProfile(profileId: string): boolean {
  return PREY.has(profileId);
}

export function isSymbioteUnlocked(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function unlockSymbioteSuit(): void {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function wallCrawlerForms(baseForms: HeroForm[]): HeroForm[] {
  if (!isSymbioteUnlocked()) return baseForms;
  if (baseForms.some((f) => f.id === SYMBIOTE_FORM.id)) return baseForms;
  return [...baseForms, SYMBIOTE_FORM];
}
