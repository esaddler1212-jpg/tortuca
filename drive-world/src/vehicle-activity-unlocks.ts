import { LANDMARK_SPRINTS } from './landmark-sprints';
import { isVallejoChapterComplete, syncVallejoMissionSteps } from './mission-chapters';
import type { SavedProgress } from './game-progress';
import { saveProgress, unlockVehicle } from './game-progress';
import { SPEED_TRAPS } from './world-extras';
import { BONUS_ACTIVITY_VEHICLE_IDS } from './vehicle-catalog';

export type ActivityUnlock = {
  id: (typeof BONUS_ACTIVITY_VEHICLE_IDS)[number];
  label: string;
  hint: string;
  satisfied: (progress: SavedProgress) => boolean;
};

export const ACTIVITY_VEHICLE_UNLOCKS: ActivityUnlock[] = [
  {
    id: 'bonus-meet-racer',
    label: 'Lot Slant Racer',
    hint: 'Hold ~12 mph at Vallejo night meet',
    satisfied: (p) => p.meetBadges.includes('vallejo-meet')
  },
  {
    id: 'bonus-sprint-king',
    label: 'Sprint King F1',
    hint: 'Finish every landmark sprint ring once',
    satisfied: (p) => LANDMARK_SPRINTS.every((s) => (p.landmarkSprintMs[s.id] ?? 0) > 0)
  },
  {
    id: 'bonus-chapter-hauler',
    label: 'Chapter Hauler',
    hint: 'Complete Vallejo chapter (15 steps)',
    satisfied: (p) => isVallejoChapterComplete(syncVallejoMissionSteps(p))
  },
  {
    id: 'bonus-vista-liner',
    label: 'Vista Line SUV',
    hint: 'Log 5 cruise vistas',
    satisfied: (p) => p.visitedVistaIds.length >= 5
  },
  {
    id: 'bonus-heat-shade',
    label: 'Heat Shade',
    hint: 'Hit max speed-trap heat (5) at least once',
    satisfied: (p) => (p.heatPeakEver ?? 0) >= 4.95
  },
  {
    id: 'bonus-trap-outlaw',
    label: 'Trap Outlaw',
    hint: '85+ mph on every freeway speed strip',
    satisfied: (p) =>
      SPEED_TRAPS.every((t) => (p.speedTrapBests[t.id] ?? 0) >= 85)
  }
];

export function bumpHeatPeak(progress: SavedProgress, level: number): SavedProgress {
  const prev = progress.heatPeakEver ?? 0;
  if (level <= prev) return progress;
  const next = { ...progress, heatPeakEver: level };
  saveProgress(next);
  return next;
}

export function tryUnlockActivityVehicles(progress: SavedProgress): {
  progress: SavedProgress;
  newlyUnlocked: string[];
} {
  const newly: string[] = [];
  let p = progress;
  for (const row of ACTIVITY_VEHICLE_UNLOCKS) {
    if (!row.satisfied(p)) continue;
    if (p.unlockedVehicleIds.includes(row.id)) continue;
    p = unlockVehicle(p, row.id);
    newly.push(row.id);
  }
  return { progress: p, newlyUnlocked: newly };
}
