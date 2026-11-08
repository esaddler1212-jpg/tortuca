import { districtHasLandmarkVisit, districtTacoFound, isDistrictCheckpointSatisfied } from './city-checkpoints';
import type { SavedProgress } from './game-progress';
import type { DistrictId } from './world-config';

export type ChapterStep = {
  id: string;
  chapter: 'vallejo' | 'bay';
  label: string;
  hint: string;
};

export const VALLEJO_CHAPTER_STEPS: ChapterStep[] = [
  {
    id: 'v-pick-car',
    chapter: 'vallejo',
    label: 'Pick your starter at the estate',
    hint: 'Cruiser, Sport, Ute, or Drifter'
  },
  {
    id: 'v-fuel',
    chapter: 'vallejo',
    label: 'Fill up at the estate pumps',
    hint: 'Pull onto the green pad under ~5 mph'
  },
  {
    id: 'v-park-estate',
    chapter: 'vallejo',
    label: 'Park at the estate valet bay',
    hint: 'Line up heading — earn at least 1★'
  },
  {
    id: 'v-taco',
    chapter: 'vallejo',
    label: 'Find the Vallejo taco truck',
    hint: 'Glowing truck on Sonoma Blvd'
  },
  {
    id: 'v-mare',
    chapter: 'vallejo',
    label: 'Scout Mare Island crane',
    hint: 'Blue beacon at the shipyard'
  },
  {
    id: 'v-carquinez',
    chapter: 'vallejo',
    label: 'Visit Carquinez tower',
    hint: 'North along the strait'
  },
  {
    id: 'v-helipad',
    chapter: 'vallejo',
    label: 'Touch down at Vallejo helipad',
    hint: 'Orange pad by the harbor'
  },
  {
    id: 'v-park-mare',
    chapter: 'vallejo',
    label: '2★ parking at Mare Island yard',
    hint: 'Green bay — slow and straight'
  },
  {
    id: 'v-drag',
    chapter: 'vallejo',
    label: 'Run the Mare Island quarter mile',
    hint: 'Launch from the christmas-tree lights'
  },
  {
    id: 'v-drift',
    chapter: 'vallejo',
    label: 'Score 500 on the Vallejo drift pad',
    hint: 'Slide the yard — handbrake / drift handling'
  },
  {
    id: 'v-time',
    chapter: 'vallejo',
    label: 'Finish the harbor time attack',
    hint: 'Hit all gate beams under the clock'
  },
  {
    id: 'v-meet',
    chapter: 'vallejo',
    label: 'Roll into the Vallejo night meet',
    hint: 'Sideshow lot or meet zone — stay under 12 mph'
  },
  {
    id: 'v-dyno',
    chapter: 'vallejo',
    label: 'Run the estate dyno once',
    hint: 'Garage → Dyno pull'
  },
  {
    id: 'v-taxi',
    chapter: 'vallejo',
    label: 'Complete a harbor courier run',
    hint: 'Contracts board → pickup → drop'
  },
  {
    id: 'v-unlock',
    chapter: 'vallejo',
    label: 'Earn North Bay region unlock',
    hint: 'Taco truck + any Vallejo landmark → North Bay Ute'
  }
];

const VALLEJO_LANDMARK_IDS = new Set(['mare-island', 'carquinez', 'vallejo-helipad', 'napa-silo']);

export function isVallejoChapterComplete(progress: SavedProgress): boolean {
  return VALLEJO_CHAPTER_STEPS.every((s) => progress.missionStepsCompleted.includes(s.id));
}

export function vallejoLandmarksVisited(progress: SavedProgress): number {
  return progress.visitedLandmarkIds.filter((id) => VALLEJO_LANDMARK_IDS.has(id)).length;
}

export function syncVallejoMissionSteps(progress: SavedProgress): SavedProgress {
  let next = progress;
  const done = new Set(progress.missionStepsCompleted);
  const mark = (id: string) => {
    if (done.has(id)) return;
    done.add(id);
    next = { ...next, missionStepsCompleted: [...done] };
  };

  if (progress.phase === 'home' && progress.activeVehicleId) mark('v-pick-car');
  if (progress.journal.some((j) => j.kind === 'fuel' && j.id === 'gas-vallejo-home')) mark('v-fuel');
  if ((progress.parkingStars['park-vallejo-estate'] ?? 0) >= 1) mark('v-park-estate');
  if (districtTacoFound(progress, 'vallejo')) mark('v-taco');
  if (progress.visitedLandmarkIds.includes('mare-island')) mark('v-mare');
  if (progress.visitedLandmarkIds.includes('carquinez')) mark('v-carquinez');
  if (progress.visitedLandmarkIds.includes('vallejo-helipad')) mark('v-helipad');
  if ((progress.parkingStars['park-mare'] ?? 0) >= 2) mark('v-park-mare');
  if (progress.cpmDragBestET != null && progress.cpmDragBestET > 0) mark('v-drag');
  if ((progress.cpmDriftBests['vallejo-yard'] ?? 0) >= 500) mark('v-drift');
  if ((progress.cpmTimeAttackMs['vallejo-harbor'] ?? 0) > 0) mark('v-time');
  if (progress.meetBadges.includes('vallejo-meet')) mark('v-meet');
  if (progress.dynoRunCount > 0) mark('v-dyno');
  if (progress.taxiCompletedIds.length > 0) mark('v-taxi');
  if (isDistrictCheckpointSatisfied(progress, 'vallejo')) mark('v-unlock');

  return next;
}

export function nextVallejoStep(progress: SavedProgress): ChapterStep | null {
  const synced = syncVallejoMissionSteps(progress);
  for (const step of VALLEJO_CHAPTER_STEPS) {
    if (!synced.missionStepsCompleted.includes(step.id)) return step;
  }
  return null;
}

export function vallejoChapterSummary(progress: SavedProgress): {
  done: number;
  total: number;
  next: ChapterStep | null;
} {
  const synced = syncVallejoMissionSteps(progress);
  const done = VALLEJO_CHAPTER_STEPS.filter((s) => synced.missionStepsCompleted.includes(s.id)).length;
  return { done, total: VALLEJO_CHAPTER_STEPS.length, next: nextVallejoStep(synced) };
}

export function bayRegionsGated(progress: SavedProgress): boolean {
  return progress.phase === 'home' && !isVallejoChapterComplete(syncVallejoMissionSteps(progress));
}

export function districtVisibleInBoard(progress: SavedProgress, district: DistrictId): boolean {
  if (!bayRegionsGated(progress)) return true;
  return district === 'vallejo';
}
