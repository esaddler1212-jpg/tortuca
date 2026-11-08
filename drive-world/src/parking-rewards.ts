import { BONUS_PARKING_IDS } from './vehicle-catalog';
import { parkingSpotsCleared } from './landmark-parking';
import type { SavedProgress } from './game-progress';
import { saveProgress, unlockVehicle } from './game-progress';

const THRESHOLDS: { count: number; vehicleId: (typeof BONUS_PARKING_IDS)[number] }[] = [
  { count: 4, vehicleId: 'bonus-bay-van' },
  { count: 8, vehicleId: 'bonus-night-delivery' },
  { count: 12, vehicleId: 'bonus-marina-hatch' }
];

export function recordParkingStars(
  progress: SavedProgress,
  spotId: string,
  stars: 1 | 2 | 3
): { progress: SavedProgress; improved: boolean; newlyUnlockedVehicles: string[] } {
  const prev = progress.parkingStars[spotId] ?? 0;
  if (stars <= prev) return { progress, improved: false, newlyUnlockedVehicles: [] };
  let next: SavedProgress = {
    ...progress,
    parkingStars: { ...progress.parkingStars, [spotId]: Math.max(prev, stars) }
  };
  saveProgress(next);
  const paints = new Set(next.unlockedPaintIds);
  let paintsChanged = false;
  if (!paints.has('parking-yellow')) {
    paints.add('parking-yellow');
    paintsChanged = true;
  }
  if (paintsChanged) {
    next = { ...next, unlockedPaintIds: [...paints] };
    saveProgress(next);
  }
  const unlocked: string[] = [];
  const cleared = parkingSpotsCleared(next.parkingStars);
  for (const row of THRESHOLDS) {
    if (cleared < row.count) continue;
    if (next.unlockedVehicleIds.includes(row.vehicleId)) continue;
    next = unlockVehicle(next, row.vehicleId);
    unlocked.push(row.vehicleId);
  }
  return { progress: next, improved: true, newlyUnlockedVehicles: unlocked };
}
