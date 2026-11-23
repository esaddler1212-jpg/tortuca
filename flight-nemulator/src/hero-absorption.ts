import type { PowerKind } from './hero-roster';
import { getHero } from './hero-roster';
import { getVillainClone } from './villain-roster';

export const ABSORBER_HERO_IDS = new Set(['cell-mimic', 'spirit-buu']);

const STORAGE_KEY = 'flight-nemulator-absorbed';

export interface AbsorptionState {
  profiles: string[];
  labels: string[];
  kitPrimary?: PowerKind;
  dmgMul: number;
  speedMul: number;
}

function empty(): AbsorptionState {
  return { profiles: [], labels: [], dmgMul: 1, speedMul: 1 };
}

function loadRaw(): AbsorptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as AbsorptionState;
    if (!Array.isArray(p.profiles)) return empty();
    return { ...empty(), ...p };
  } catch {
    return empty();
  }
}

export function loadAbsorption(heroId: string): AbsorptionState {
  if (!ABSORBER_HERO_IDS.has(heroId)) return empty();
  return loadRaw();
}

export function saveAbsorption(state: AbsorptionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAbsorption(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function powerFromProfile(profileId: string): PowerKind | undefined {
  const villain = getVillainClone(profileId);
  if (villain) {
    const rival = villain.rivalHeroIds[0];
    const hero = rival ? getHero(rival) : undefined;
    return hero?.powers[0];
  }
  const hero = getHero(profileId);
  return hero?.powers[0];
}

export function absorbDefeatedFoe(heroId: string, profileId: string, codename: string): AbsorptionState | null {
  if (!ABSORBER_HERO_IDS.has(heroId)) return null;
  const state = loadRaw();
  if (state.profiles.includes(profileId)) return state;
  if (state.profiles.length >= 6) return state;
  state.profiles.push(profileId);
  state.labels.push(codename);
  state.dmgMul = Math.min(1.55, state.dmgMul + 0.08);
  state.speedMul = Math.min(1.25, state.speedMul + 0.04);
  const p = powerFromProfile(profileId);
  if (p) state.kitPrimary = p;
  saveAbsorption(state);
  return state;
}

export function absorptionHudLine(state: AbsorptionState): string | null {
  if (state.labels.length === 0) return null;
  return `Absorbed: ${state.labels.slice(-4).join(', ')}`;
}
