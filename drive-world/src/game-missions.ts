import { BONUS_AERIAL_IDS, BONUS_LEGEND_IDS, REGION_VEHICLE_IDS, getVehicleSpec } from './vehicle-catalog';
import {
  DISTRICT_LABELS,
  LANDMARKS,
  districtLandmarkTotal,
  districtLandmarksVisited,
} from './landmark-registry';
import { nextUnvisitedLandmark } from './landmark-navigation';
import type { SavedProgress } from './game-progress';
import { SCENIC_ROUTES, SPEED_TRAPS } from './world-extras';
import type { DistrictId } from './world-config';

export type MissionLine = { id: string; label: string; done: boolean; hint?: string };

export function buildMissionBoard(
  progress: SavedProgress,
  playerX: number,
  playerZ: number
): MissionLine[] {
  const lines: MissionLine[] = [];

  if (progress.phase === 'waymo_ride') {
    lines.push({ id: 'waymo', label: 'Ride Waymo to Vallejo safehouse', done: false });
    return lines;
  }
  if (progress.phase === 'pick_car') {
    lines.push({ id: 'pick', label: 'Pick a safehouse starter at the garage', done: false });
    return lines;
  }

  const next = nextUnvisitedLandmark(progress.visitedLandmarkIds, playerX, playerZ);
  if (next) {
    lines.push({
      id: 'next-lm',
      label: `Next landmark: ${next.name}`,
      done: false,
      hint: DISTRICT_LABELS[next.district]
    });
  }

  (Object.keys(DISTRICT_LABELS) as DistrictId[]).forEach((d) => {
    const v = districtLandmarksVisited(progress.visitedLandmarkIds, d);
    const t = districtLandmarkTotal(d);
    const complete = v >= t;
    lines.push({
      id: `region-${d}`,
      label: `${DISTRICT_LABELS[d]} ${v}/${t}`,
      done: complete,
      hint: complete ? 'Regional car unlocked' : `Reward: ${getVehicleSpec(REGION_VEHICLE_IDS[d]).name}`
    });
  });

  for (const route of SCENIC_ROUTES) {
    const done = progress.scenicCompleted.includes(route.id);
    const idx = progress.scenicProgress[route.id] ?? 0;
    lines.push({
      id: `scenic-${route.id}`,
      label: `Scenic: ${route.name}`,
      done,
      hint: done ? 'Complete' : `Checkpoint ${idx + 1}/${route.points.length}`
    });
  }

  if (!progress.unlockedVehicleIds.includes(BONUS_AERIAL_IDS[0]) && progress.scenicCompleted.length < SCENIC_ROUTES.length) {
    lines.push({ id: 'skyway', label: 'Unlock Skyway Hover', done: false, hint: 'Finish all scenic routes' });
  }
  if (!progress.unlockedVehicleIds.includes(BONUS_LEGEND_IDS[0]) && !progress.collectedIds.includes('cave-key')) {
    lines.push({ id: 'gotham', label: 'Unlock Gotham Knight', done: false, hint: 'Cave key (Coit / Telegraph)' });
  }

  const trapsHit = SPEED_TRAPS.filter((t) => (progress.speedTrapBests[t.id] ?? 0) >= 70).length;
  if (trapsHit < SPEED_TRAPS.length) {
    lines.push({
      id: 'traps',
      label: `Speed traps at 70+ mph: ${trapsHit}/${SPEED_TRAPS.length}`,
      done: false
    });
  }

  lines.push({
    id: 'landmarks',
    label: `Landmarks logged ${progress.visitedLandmarkIds.length}/${LANDMARKS.length}`,
    done: progress.visitedLandmarkIds.length >= LANDMARKS.length
  });

  return lines;
}
