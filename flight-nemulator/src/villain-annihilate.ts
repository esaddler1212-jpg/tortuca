import type { CityIntegrityState } from './city-integrity';
import type { PlayerRole } from './player-role';

/** Villain havoc required to unlock planetary annihilation. */
export const ANNIHILATE_HAVOC_USD = 12_000_000;

export function annihilateUnlocked(role: PlayerRole, city: CityIntegrityState): boolean {
  return role === 'villain' && city.havocUsd >= ANNIHILATE_HAVOC_USD;
}

export function annihilateProgress(city: CityIntegrityState): number {
  return Math.min(1, city.havocUsd / ANNIHILATE_HAVOC_USD);
}
