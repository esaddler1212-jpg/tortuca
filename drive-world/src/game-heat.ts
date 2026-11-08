import type { SavedProgress } from './game-progress';
import { saveProgress } from './game-progress';
import { SPEED_TRAPS } from './world-extras';

export const HEAT_MAX = 5;

export function heatDecay(progress: SavedProgress, mph: number, dt: number): SavedProgress {
  const level = progress.heatLevel ?? 0;
  if (level <= 0) return progress;
  let decay = 0.35 * dt;
  if (mph < 28) decay += 0.5 * dt;
  const next = Math.max(0, level - decay);
  if (Math.abs(next - level) < 0.05) return progress;
  const updated = { ...progress, heatLevel: next };
  saveProgress(updated);
  return updated;
}

export function heatFromSpeedTrap(progress: SavedProgress, mph: number, px: number, pz: number): SavedProgress {
  if (mph < 72) return progress;
  const inTrap = SPEED_TRAPS.some((t) => Math.hypot(px - t.x, pz - t.z) < t.radius + 5);
  if (!inTrap) return progress;
  const bump = mph >= 95 ? 1.4 : mph >= 85 ? 1 : 0.6;
  const level = Math.min(HEAT_MAX, (progress.heatLevel ?? 0) + bump);
  if (level === progress.heatLevel) return progress;
  const updated = { ...progress, heatLevel: level };
  saveProgress(updated);
  return updated;
}

export function heatLabel(level: number): string {
  if (level < 0.5) return 'Cool';
  if (level < 2) return 'Watched';
  if (level < 3.5) return 'Hot';
  return 'Hunted';
}
