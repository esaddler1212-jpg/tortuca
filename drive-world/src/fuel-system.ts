import type { GameSettings } from './game-settings';
import type { SavedProgress } from './game-progress';
import { isAerialVehicle } from './vehicle-catalog';

const TANK = 1;
/** Hours of spirited driving at ~40 mph equivalent before empty (very generous). */
const DRAIN_AT_40_MPH = 1 / (55 * 60);

export function fuelMultiplier(progress: SavedProgress, settings: GameSettings, vehicleId: string | null): number {
  if (!settings.fuelSimEnabled || !vehicleId) return 1;
  if (isAerialVehicle(vehicleId)) return 1;
  const level = progress.fuelLevel ?? 1;
  if (level <= 0.04) return 0.35;
  if (level <= 0.12) return 0.65;
  return 1;
}

export function tickFuel(
  progress: SavedProgress,
  settings: GameSettings,
  mph: number,
  vehicleId: string | null,
  dt: number
): SavedProgress {
  if (!settings.fuelSimEnabled || !vehicleId || isAerialVehicle(vehicleId)) return progress;
  const throttleFactor = Math.min(1, mph / 55);
  const drain = DRAIN_AT_40_MPH * throttleFactor * dt;
  const nextLevel = Math.max(0, (progress.fuelLevel ?? 1) - drain);
  if (Math.abs(nextLevel - (progress.fuelLevel ?? 1)) < 0.0001) return progress;
  return { ...progress, fuelLevel: nextLevel };
}

export function refillFuel(progress: SavedProgress): { progress: SavedProgress; fresh: boolean } {
  if ((progress.fuelLevel ?? 1) >= 0.999) return { progress, fresh: false };
  let next: SavedProgress = { ...progress, fuelLevel: TANK };
  if (!next.unlockedPaintIds.includes('fuel-green')) {
    next = { ...next, unlockedPaintIds: [...next.unlockedPaintIds, 'fuel-green'] };
  }
  return { progress: next, fresh: true };
}

export function fuelPercent(progress: SavedProgress): number {
  return Math.round(Math.max(0, Math.min(1, progress.fuelLevel ?? 1)) * 100);
}
