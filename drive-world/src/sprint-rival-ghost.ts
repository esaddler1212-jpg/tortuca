/**
 * Landmark sprint rival pacing — inspired by Summer Engine racing difficulty tiers.
 * Shows a delta vs an authored par or the player's PB when no personal ghost tape exists.
 */
import type { SavedProgress } from './game-progress';

export type SprintRivalTier = 'easy' | 'medium' | 'hard';

/** Rival finishes faster on hard (lower time multiplier). */
const TIER_PACE: Record<SprintRivalTier, number> = {
  easy: 1.09,
  medium: 1.0,
  hard: 0.93
};

/** Approximate par laps for HUD rival (ms). Tune from playtest. */
const SPRINT_PAR_MS: Record<string, number> = {
  'freeway-i80-east': 72_000,
  'vallejo-estate-mare': 44_000,
  'mare-carquinez': 40_000,
  'sf-bridge-vista': 58_000
};

export function sprintRivalGhostHud(
  progress: SavedProgress,
  sprintId: string,
  progress01: number,
  elapsedMs: number,
  tier: SprintRivalTier
): string | null {
  const pb = progress.landmarkSprintMs[sprintId];
  const baseMs = pb && pb > 0 ? pb : SPRINT_PAR_MS[sprintId];
  if (!baseMs || elapsedMs < 0) return null;
  const rivalTotal = baseMs * TIER_PACE[tier];
  const ghostMs = rivalTotal * Math.max(0, Math.min(1, progress01));
  const deltaSec = (elapsedMs - ghostMs) / 1000;
  if (Math.abs(deltaSec) < 0.05) return `On rival pace (${tier})`;
  const sign = deltaSec > 0 ? '+' : '';
  const source = pb && pb > 0 ? 'PB ghost' : 'par';
  return `${sign}${deltaSec.toFixed(2)}s vs rival · ${tier} · ${source}`;
}