import { TOKYO_LANDMARKS, tokyoUnlockStatus } from './tokyo-map';
import {
  AUTOPILOT_VEHICLE_ID,
  BONUS_AERIAL_IDS,
  BONUS_LEGEND_IDS,
  BONUS_PARKING_IDS,
  REGION_VEHICLE_IDS,
  getVehicleSpec
} from './vehicle-catalog';
import { ACTIVITY_VEHICLE_UNLOCKS } from './vehicle-activity-unlocks';
import { DISTRICT_MEET_UNLOCKS } from './district-meets';
import { districtHasLandmarkVisit, districtTacoFound } from './city-checkpoints';
import { DISTRICT_LABELS, LANDMARKS } from './landmark-registry';
import { nextUnvisitedLandmark } from './landmark-navigation';
import type { SavedProgress } from './game-progress';
import { nearestGasStationAnywhere } from './bay-navigation';
import { DRIFT_PADS, DRAG_STRIPS, TIME_ATTACKS } from './cpm-challenges';
import { TAXI_CONTRACTS, nextTaxiContract } from './cpm-taxi';
import { LANDMARK_PARKING, parkingSpotsCleared, parkingSpotCount } from './landmark-parking';
import {
  VALLEJO_CHAPTER_STEPS,
  bayRegionsGated,
  districtVisibleInBoard,
  isVallejoChapterComplete,
  nextVallejoStep,
  syncVallejoMissionSteps,
  vallejoChapterSummary
} from './mission-chapters';
import { SCENIC_ROUTES, SPEED_TRAPS } from './world-extras';
import type { DistrictId } from './world-config';

export type MissionLine = { id: string; label: string; done: boolean; hint?: string; action?: 'taxi' };

export function buildMissionBoard(
  progress: SavedProgress,
  playerX: number,
  playerZ: number,
  fuelPercent?: number
): MissionLine[] {
  const lines: MissionLine[] = [];
  const synced = syncVallejoMissionSteps(progress);

  if (synced.phase === 'waymo_ride') {
    lines.push({
      id: 'waymo',
      label: 'Prologue: Waymo drop at Vallejo estate',
      done: false,
      hint: 'CPM chapter 1 starts when you pick a car'
    });
    return lines;
  }
  if (synced.phase === 'pick_car') {
    lines.push({
      id: 'pick',
      label: 'Chapter 1 · Step 1 — pick your starter',
      done: false,
      hint: 'Cruiser, Sport, Ute, or Drifter'
    });
    return lines;
  }

  if (bayRegionsGated(synced)) {
    const step = nextVallejoStep(synced);
    lines.push({
      id: 'chapter-intro',
      label: 'Chapter 1: Vallejo — open the Bay',
      done: false,
      hint: 'Taco truck + any Vallejo landmark, then the full map unlocks'
    });
    if (step) {
      lines.push({
        id: step.id,
        label: step.label,
        done: false,
        hint: step.hint,
        action: step.id === 'v-taxi' ? 'taxi' : undefined
      });
    }
    return lines;
  }

  lines.push({
    id: 'chapter-open',
    label: 'Bay open world — CPM loops unlocked',
    done: true,
    hint: 'Parking, strips, drag, courier board, meets'
  });

  const chapter = vallejoChapterSummary(synced);
  if (!isVallejoChapterComplete(synced)) {
    lines.push({
      id: 'chapter-vallejo',
      label: `Vallejo mastery (${chapter.done}/${chapter.total})`,
      done: false,
      hint: 'Optional — finishing it unlocks the Chapter Hauler'
    });
    if (chapter.next) {
      lines.push({
        id: chapter.next.id,
        label: `○ ${chapter.next.label}`,
        done: false,
        hint: chapter.next.hint,
        action: chapter.next.id === 'v-taxi' ? 'taxi' : undefined
      });
    }
    const taxi = nextTaxiContract(synced, 'vallejo');
    if (taxi && !synced.activeTaxiId && chapter.next?.id === 'v-taxi') {
      lines.push({
        id: 'taxi-offer',
        label: `Courier gig: ${taxi.label}`,
        done: false,
        hint: 'Tap Start courier in the mission header',
        action: 'taxi'
      });
    }
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

  const next = nextUnvisitedLandmark(synced.visitedLandmarkIds, playerX, playerZ);
  if (next) {
    lines.push({
      id: 'next-lm',
      label: `Next landmark: ${next.name}`,
      done: false,
      hint: DISTRICT_LABELS[next.district]
    });
  }

  (Object.keys(DISTRICT_LABELS) as DistrictId[]).forEach((d) => {
    if (!districtVisibleInBoard(synced, d)) return;
    const unlocked = synced.unlockedRegionIds.includes(d);
    const taco = districtTacoFound(synced, d);
    const landmark = districtHasLandmarkVisit(synced, d);
    const reward = getVehicleSpec(REGION_VEHICLE_IDS[d]).name;
    lines.push({
      id: `region-${d}`,
      label: `${DISTRICT_LABELS[d]} — taco ${taco ? '✓' : '…'} · landmark ${landmark ? '✓' : '…'}`,
      done: unlocked,
      hint: unlocked ? `${reward} + safehouse` : `Find the taco truck + any landmark → ${reward}`
    });
  });

  const parked = parkingSpotsCleared(synced.parkingStars);
  lines.push({
    id: 'parking-summary',
    label: `Parking challenges ${parked}/${parkingSpotCount()}`,
    done: parked >= parkingSpotCount(),
    hint: 'CPM-style bays — stars unlock Kenney shuttles'
  });
  const nextPark = LANDMARK_PARKING.find((p) => !(synced.parkingStars[p.id] ?? 0));
  if (nextPark) {
    lines.push({
      id: 'parking-next',
      label: `Next bay: ${nextPark.name}`,
      done: false,
      hint: 'Under ~5 mph in the lit rectangle'
    });
  }

  for (const pad of DRIFT_PADS) {
    const best = synced.cpmDriftBests[pad.id] ?? 0;
    lines.push({
      id: `drift-${pad.id}`,
      label: `Drift: ${pad.name}`,
      done: best >= pad.goalScore,
      hint: best > 0 ? `Best ${best} / ${pad.goalScore}` : `Slide for ${pad.goalScore}+ pts`
    });
  }

  for (const strip of DRAG_STRIPS) {
    const et = synced.cpmDragBestET;
    lines.push({
      id: `drag-${strip.id}`,
      label: `Drag: ${strip.name}`,
      done: et != null,
      hint: et != null ? `Best ${et.toFixed(2)} s` : 'Stage at the yellow tree'
    });
  }

  for (const attack of TIME_ATTACKS) {
    const ms = synced.cpmTimeAttackMs[attack.id];
    lines.push({
      id: `time-${attack.id}`,
      label: `Time attack: ${attack.name}`,
      done: ms != null && ms > 0,
      hint: ms ? `PB ${(ms / 1000).toFixed(2)} s` : 'Hit cyan gates in order'
    });
  }

  const openTaxi = nextTaxiContract(synced);
  if (openTaxi) {
    lines.push({
      id: `taxi-${openTaxi.id}`,
      label: `Courier: ${openTaxi.label}`,
      done: synced.taxiCompletedIds.includes(openTaxi.id),
      hint: openTaxi.payHint,
      action: 'taxi'
    });
  }

  if (synced.dynoRunCount < 1) {
    lines.push({ id: 'dyno', label: 'Run the safehouse dyno', done: false, hint: 'Garage → Dyno pull' });
  }

  const cultureHints: { id: string; label: string; collectible: string }[] = [
    { id: 'c-flux', label: 'Time Warp Coupe (flies)', collectible: 'flux-trail' },
    { id: 'c-hyphy', label: 'Hyphy Short Bus', collectible: 'hyphy-whistle' },
    { id: 'c-cookie', label: 'Cookie Tour Bus', collectible: 'cookie-case' },
    { id: 'c-willie', label: 'Say Hey Lowrider', collectible: 'willie-glove' },
    { id: 'c-beast', label: 'Beast Mode Cart', collectible: 'beast-bell' }
  ];
  for (const h of cultureHints) {
    if (synced.collectedIds.includes(h.collectible)) continue;
    lines.push({ id: h.id, label: `Homage: ${h.label}`, done: false, hint: 'Grab the glowing token' });
  }

  for (const route of SCENIC_ROUTES) {
    const done = synced.scenicCompleted.includes(route.id);
    const idx = synced.scenicProgress[route.id] ?? 0;
    lines.push({
      id: `scenic-${route.id}`,
      label: `Scenic: ${route.name}`,
      done,
      hint: done ? 'Complete' : `Checkpoint ${idx + 1}/${route.points.length}`
    });
  }

  for (const meet of DISTRICT_MEET_UNLOCKS) {
    const owned = synced.unlockedVehicleIds.includes(meet.vehicleId);
    const atLot = synced.meetBadges.includes(meet.badgeId);
    lines.push({
      id: `meet-${meet.district}`,
      label: `${owned ? '✓' : '○'} Meet car: ${meet.label}`,
      done: owned,
      hint: atLot ? 'Unlocked at garage' : 'Tonight’s sideshow — roll in under 12 mph'
    });
  }

  const craftHints = [
    { id: 'craft-w', collectible: 'craft-wedge-shard', label: 'Bay Wedge' },
    { id: 'craft-l', collectible: 'craft-lift-shard', label: 'Night Lift' },
    { id: 'craft-s', collectible: 'craft-spike-shard', label: 'Street Spike' }
  ];
  for (const h of craftHints) {
    if (synced.unlockedVehicleIds.some((id) => id.startsWith('craft-'))) continue;
    if (synced.collectedIds.includes(h.collectible)) continue;
    lines.push({
      id: h.id,
      label: `Craft original: ${h.label}`,
      done: false,
      hint: 'Grab the cyan craft shard beacon'
    });
  }

  for (const act of ACTIVITY_VEHICLE_UNLOCKS) {
    const owned = synced.unlockedVehicleIds.includes(act.id);
    lines.push({
      id: `act-${act.id}`,
      label: `${owned ? '✓' : '○'} Activity: ${act.label}`,
      done: owned,
      hint: act.hint
    });
  }

  const trapsHit = SPEED_TRAPS.filter((t) => (synced.speedTrapBests[t.id] ?? 0) >= 70).length;
  if (trapsHit < SPEED_TRAPS.length) {
    lines.push({
      id: 'traps',
      label: `Speed strips 70+ mph: ${trapsHit}/${SPEED_TRAPS.length}`,
      done: false
    });
  }

  lines.push({
    id: 'landmarks',
    label: `Landmarks logged ${synced.visitedLandmarkIds.length}/${LANDMARKS.length}`,
    done: synced.visitedLandmarkIds.length >= LANDMARKS.length
  });

  const tokyo = tokyoUnlockStatus(synced);
  if (!tokyo.unlocked) {
    lines.push({
      id: 'tokyo-unlock',
      label: `Bonus: Tokyo flight — cars ${tokyo.cars}/${tokyo.carsTotal} · regions ${tokyo.regions}/${tokyo.regionsTotal}`,
      done: false,
      hint: 'Unlock everything, then board at the SFO gate'
    });
  } else {
    const logged = synced.tokyoLandmarkIds.length;
    lines.push({
      id: 'tokyo-landmarks',
      label: `Tokyo landmarks ${logged}/${TOKYO_LANDMARKS.length}`,
      done: logged >= TOKYO_LANDMARKS.length,
      hint:
        logged >= TOKYO_LANDMARKS.length
          ? 'Shuto Night Runner unlocked'
          : synced.tokyoFlights === 0
            ? 'SFO gate is open — stop on the pink pad, press F'
            : 'Log every Tokyo spot for the Shuto Night Runner'
    });
  }

  return lines;
}

export function missionBannerText(progress: SavedProgress): string {
  const synced = syncVallejoMissionSteps(progress);
  if (synced.phase === 'waymo_ride') return 'Prologue: Waymo to Vallejo estate';
  if (synced.phase === 'pick_car') return 'Chapter 1: Vallejo — pick your starter';
  if (bayRegionsGated(synced)) {
    const n = nextVallejoStep(synced);
    return n ? `Chapter 1: ${n.label}` : 'Chapter 1: finish Vallejo unlock';
  }
  return 'Bay open world — parking · drift · drag · courier';
}
