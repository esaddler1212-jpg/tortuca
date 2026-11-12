import type { DistrictId } from './world-config';
import type { SavedProgress } from './game-progress';
import { saveProgress, unlockVehicle } from './game-progress';
import { SIDESHOW_SITES, type SideshowSite } from './sideshow-meets';
import { DISTRICT_MEET_VEHICLE_IDS } from './vehicle-catalog';

const SITE_DISTRICT: Record<string, DistrictId> = {
  'oakland-lake': 'eastBay',
  emeryville: 'eastBay',
  'vallejo-yard': 'vallejo',
  'sf-pier': 'sf',
  'san-jose-arena': 'southBay',
  'concord-plaza': 'eastBay',
  'peninsula-lot': 'peninsula',
  'marin-view': 'marin'
};

export function districtForMeetSite(site: SideshowSite): DistrictId {
  return SITE_DISTRICT[site.id] ?? 'eastBay';
}

/** Legacy vallejo badge id kept for save compatibility. */
export function meetBadgeIdForDistrict(district: DistrictId): string {
  if (district === 'vallejo') return 'vallejo-meet';
  return `meet-${district}`;
}

export const DISTRICT_MEET_UNLOCKS: {
  badgeId: string;
  district: DistrictId;
  vehicleId: (typeof DISTRICT_MEET_VEHICLE_IDS)[number];
  label: string;
}[] = [
  { badgeId: 'vallejo-meet', district: 'vallejo', vehicleId: 'meet-vallejo-lot', label: 'Vallejo Lot Runner' },
  { badgeId: 'meet-sf', district: 'sf', vehicleId: 'meet-sf-flash', label: 'Fog Flash' },
  { badgeId: 'meet-marin', district: 'marin', vehicleId: 'meet-marin-breeze', label: 'Marin Breeze' },
  { badgeId: 'meet-eastBay', district: 'eastBay', vehicleId: 'meet-east-donk', label: 'Town Donk' },
  { badgeId: 'meet-peninsula', district: 'peninsula', vehicleId: 'meet-pen-low', label: 'Sand Low' },
  { badgeId: 'meet-southBay', district: 'southBay', vehicleId: 'meet-south-arc', label: 'Silicon Arc' }
];

export function tryAwardDistrictMeetBadge(
  progress: SavedProgress,
  site: SideshowSite,
  mph: number,
  holdSec: number
): SavedProgress {
  if (mph >= 12 || holdSec < 2.15) return progress;
  const district = districtForMeetSite(site);
  const badge = meetBadgeIdForDistrict(district);
  if (progress.meetBadges.includes(badge)) return progress;
  const next = { ...progress, meetBadges: [...progress.meetBadges, badge] };
  saveProgress(next);
  return next;
}

export function tryUnlockDistrictMeetVehicles(progress: SavedProgress): {
  progress: SavedProgress;
  newlyUnlocked: string[];
} {
  const newly: string[] = [];
  let p = progress;
  for (const row of DISTRICT_MEET_UNLOCKS) {
    if (!p.meetBadges.includes(row.badgeId)) continue;
    if (p.unlockedVehicleIds.includes(row.vehicleId)) continue;
    p = unlockVehicle(p, row.vehicleId);
    newly.push(row.vehicleId);
  }
  return { progress: p, newlyUnlocked: newly };
}

export function activeMeetSitesNearby(px: number, pz: number, maxDist = 48): SideshowSite | null {
  for (const site of SIDESHOW_SITES) {
    if (Math.hypot(px - site.x, pz - site.z) < maxDist) return site;
  }
  return null;
}
