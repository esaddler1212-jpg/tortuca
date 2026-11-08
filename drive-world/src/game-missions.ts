import {
  AUTOPILOT_VEHICLE_ID,
  BONUS_AERIAL_IDS,
  BONUS_LEGEND_IDS,
  BONUS_PARKING_IDS,
  REGION_VEHICLE_IDS,
  getVehicleSpec
} from './vehicle-catalog';
import { districtHasLandmarkVisit, districtTacoFound } from './city-checkpoints';
import { DISTRICT_LABELS, LANDMARKS } from './landmark-registry';
import { nextUnvisitedLandmark } from './landmark-navigation';
import type { SavedProgress } from './game-progress';
import { nearestGasStationAnywhere } from './bay-navigation';
import { LANDMARK_PARKING, parkingSpotsCleared, parkingSpotCount } from './landmark-parking';
import { SCENIC_ROUTES, SPEED_TRAPS } from './world-extras';
import type { DistrictId } from './world-config';

export type MissionLine = { id: string; label: string; done: boolean; hint?: string };

export function buildMissionBoard(
  progress: SavedProgress,
  playerX: number,
  playerZ: number,
  fuelPercent?: number
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

  if (fuelPercent !== undefined && fuelPercent < 28) {
    const pump = nearestGasStationAnywhere(playerX, playerZ);
    if (pump) {
      lines.push({
        id: 'fuel-low',
        label: `Low fuel — head to ${pump.name}`,
        done: false,
        hint: 'Stop below 5 mph on the green pad'
      });
    }
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
    const unlocked = progress.unlockedRegionIds.includes(d);
    const taco = districtTacoFound(progress, d);
    const landmark = districtHasLandmarkVisit(progress, d);
    const reward = getVehicleSpec(REGION_VEHICLE_IDS[d]).name;
    lines.push({
      id: `region-${d}`,
      label: `${DISTRICT_LABELS[d]} — taco ${taco ? '✓' : '…'} · landmark ${landmark ? '✓' : '…'}`,
      done: unlocked,
      hint: unlocked
        ? `${reward} + safehouse`
        : `Find the taco truck + any landmark → ${reward}`
    });
  });

  const parked = parkingSpotsCleared(progress.parkingStars);
  lines.push({
    id: 'parking-summary',
    label: `Landmark parking ${parked}/${parkingSpotCount()}`,
    done: parked >= parkingSpotCount(),
    hint: 'Green bays at landmarks — slow, straight, hold steady'
  });
  const nextPark = LANDMARK_PARKING.find((p) => !(progress.parkingStars[p.id] ?? 0));
  if (nextPark) {
    lines.push({
      id: 'parking-next',
      label: `Next bay: ${nextPark.name}`,
      done: false,
      hint: 'Under ~5 mph in the lit rectangle'
    });
  }
  if (!progress.unlockedVehicleIds.includes(BONUS_PARKING_IDS[0]) && parked < 4) {
    lines.push({ id: 'park-van', label: 'Unlock Bay Shuttle Van', done: false, hint: '4 parking badges' });
  }

  const cultureHints: { id: string; label: string; collectible: string }[] = [
    { id: 'c-flux', label: 'Time Warp Coupe (flies)', collectible: 'flux-trail' },
    { id: 'c-hyphy', label: 'Hyphy Short Bus', collectible: 'hyphy-whistle' },
    { id: 'c-cookie', label: 'Cookie Tour Bus', collectible: 'cookie-case' },
    { id: 'c-willie', label: 'Say Hey Lowrider', collectible: 'willie-glove' },
    { id: 'c-beast', label: 'Beast Mode Cart', collectible: 'beast-bell' }
  ];
  for (const h of cultureHints) {
    if (progress.collectedIds.includes(h.collectible)) continue;
    lines.push({ id: h.id, label: `Homage: ${h.label}`, done: false, hint: 'Grab the glowing token' });
  }

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
  if (!progress.unlockedVehicleIds.includes(AUTOPILOT_VEHICLE_ID) && !progress.collectedIds.includes('tech-chip')) {
    lines.push({
      id: 'night-coil',
      label: 'Unlock Night Coil (autopilot)',
      done: false,
      hint: 'Silicon wafer on the Peninsula'
    });
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
