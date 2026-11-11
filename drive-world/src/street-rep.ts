import type { DistrictId } from './world-config';
import { DISTRICT_LABELS, districtLandmarkTotal, districtLandmarksVisited } from './landmark-registry';
import type { SavedProgress } from './game-progress';

const BAY_REGIONS: DistrictId[] = ['vallejo', 'sf', 'marin', 'eastBay', 'peninsula', 'southBay'];

export type StreetRepRank = {
  id: string;
  label: string;
  min: number;
};

export const STREET_REP_RANKS: StreetRepRank[] = [
  { id: 'rookie', label: 'Rookie', min: 0 },
  { id: 'runner', label: 'Street Runner', min: 15 },
  { id: 'local', label: 'Local', min: 30 },
  { id: 'regular', label: 'Regular', min: 45 },
  { id: 'known', label: 'Known Name', min: 60 },
  { id: 'kingpin', label: 'Kingpin', min: 75 },
  { id: 'legend', label: 'Bay Legend', min: 90 }
];

/** 0–100 per region from landmarks, taco truck, and region unlock. */
export function regionRepPercent(progress: SavedProgress, district: DistrictId): number {
  const total = districtLandmarkTotal(district);
  if (total === 0) return 0;
  const visited = districtLandmarksVisited(progress.visitedLandmarkIds, district);
  let score = (visited / total) * 70;
  if (progress.tacoTrucksFound.includes(district)) score += 15;
  if (progress.unlockedRegionIds.includes(district)) score += 15;
  return Math.min(100, Math.round(score));
}

/** Bay-wide rep: mean of region scores (all six districts). */
export function bayStreetRepPercent(progress: SavedProgress): number {
  const sum = BAY_REGIONS.reduce((a, d) => a + regionRepPercent(progress, d), 0);
  return Math.round(sum / BAY_REGIONS.length);
}

export function streetRepRankFor(percent: number): StreetRepRank {
  let best = STREET_REP_RANKS[0]!;
  for (const r of STREET_REP_RANKS) {
    if (percent >= r.min) best = r;
  }
  return best;
}

export function regionRepLabel(district: DistrictId, percent: number): string {
  return `${DISTRICT_LABELS[district]} ${percent}%`;
}

/** Update cached peak for rank-up toasts; returns { next, rankUp } */
export function bumpStreetRepPeak(progress: SavedProgress): {
  progress: SavedProgress;
  rankUp: StreetRepRank | null;
} {
  const rep = bayStreetRepPercent(progress);
  const prevPeak = progress.streetRepPeak ?? 0;
  if (rep <= prevPeak) return { progress, rankUp: null };
  const prevRank = streetRepRankFor(prevPeak);
  const nextRank = streetRepRankFor(rep);
  const next = { ...progress, streetRepPeak: rep };
  const rankUp = nextRank.min > prevRank.min ? nextRank : null;
  return { progress: next, rankUp };
}
