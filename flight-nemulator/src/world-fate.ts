import type { CityIntegrityState } from './city-integrity';
import type { PlayerRole } from './player-role';

export const DYING_ROAM_MS = 5 * 60 * 1000;
export const HERO_SAVE_INTEGRITY = 52;
export const PLANET_DYING_INTEGRITY = 12;

export type WorldFatePhase = 'normal' | 'dying_roam' | 'hero_saved';

export type WorldFateState = {
  phase: WorldFatePhase;
  dyingRoamEndMs: number | null;
  fatePrompt: boolean;
  heroSaved: boolean;
  villainRemakeOffered: boolean;
};

export function createWorldFate(): WorldFateState {
  return {
    phase: 'normal',
    dyingRoamEndMs: null,
    fatePrompt: false,
    heroSaved: false,
    villainRemakeOffered: false
  };
}

export function shouldOfferVillainDyingPlanet(
  role: PlayerRole,
  city: CityIntegrityState,
  fate: WorldFateState
): boolean {
  if (role !== 'villain' || fate.villainRemakeOffered) return false;
  return city.integrityPct <= PLANET_DYING_INTEGRITY;
}

export function beginVillainDyingRoam(fate: WorldFateState, nowMs: number): void {
  fate.phase = 'dying_roam';
  fate.dyingRoamEndMs = nowMs + DYING_ROAM_MS;
  fate.fatePrompt = true;
  fate.villainRemakeOffered = true;
}

export function dyingRoamSecondsLeft(fate: WorldFateState, nowMs: number): number {
  if (fate.dyingRoamEndMs == null) return 0;
  return Math.max(0, Math.ceil((fate.dyingRoamEndMs - nowMs) / 1000));
}

export function dyingRoamExpired(fate: WorldFateState, nowMs: number): boolean {
  return fate.phase === 'dying_roam' && fate.dyingRoamEndMs != null && nowMs >= fate.dyingRoamEndMs;
}

export function canDeclareHeroSave(
  role: PlayerRole,
  city: CityIntegrityState,
  wave: number,
  foesLeft: number,
  foesStopped: number,
  fate: WorldFateState
): boolean {
  if (role !== 'hero' || fate.heroSaved) return false;
  if (city.integrityPct < HERO_SAVE_INTEGRITY) return false;
  if (wave < 2) return false;
  if (foesLeft > 0 && foesStopped < wave) return false;
  return foesLeft === 0 || foesStopped >= wave + 1;
}
