import type { DestructibleTag } from './build-city';
import type { PlayerRole } from './player-role';

export type CityIntegrityState = {
  /** Hero: 0–100 how much skyline survives */
  integrityPct: number;
  /** Villain: accumulated havoc score */
  havocUsd: number;
};

export function createCityIntegrity(): CityIntegrityState {
  return { integrityPct: 100, havocUsd: 0 };
}

export function syncIntegrityFromBuildings(state: CityIntegrityState, tags: DestructibleTag[]): void {
  let total = 0;
  let intact = 0;
  for (const t of tags) {
    if (t.immune) continue;
    total++;
    if (t.intact) intact++;
  }
  if (total < 1) return;
  const pct = (intact / total) * 100;
  state.integrityPct = Math.min(state.integrityPct, pct);
}

export function applyRaiderSiege(state: CityIntegrityState, buildingCostUsd: number): void {
  state.integrityPct = Math.max(0, state.integrityPct - buildingCostUsd / 2_500_000);
}

export function addVillainHavoc(state: CityIntegrityState, costUsd: number): void {
  state.havocUsd += costUsd;
}

export function integrityHudLabel(role: PlayerRole, state: CityIntegrityState): string {
  if (role === 'villain') {
    const m = state.havocUsd;
    if (m >= 1_000_000) return `Havoc $${(m / 1_000_000).toFixed(1)}M`;
    if (m >= 1000) return `Havoc $${Math.round(m / 1000)}k`;
    return `Havoc $${Math.round(m)}`;
  }
  return `City ${Math.round(state.integrityPct)}%`;
}
