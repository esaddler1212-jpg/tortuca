import { hillOffsetM } from './bay-terrain';
import { VALLEJO_SAFEHOUSE } from './landmark-registry';
import type { CustomSafehouse, SavedProgress } from './game-progress';
import { saveProgress } from './game-progress';
import { districtAt } from './regional-weather';
import type { DistrictId } from './world-config';

export type SafehousePreset = {
  id: string;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  radius: number;
  /** Unlock after clearing this region's landmarks */
  unlockDistrict?: DistrictId;
};

export const PRESET_SAFEHOUSES: SafehousePreset[] = [
  {
    id: 'vallejo-safehouse',
    name: 'Vallejo harbor',
    district: 'vallejo',
    x: VALLEJO_SAFEHOUSE.x,
    z: VALLEJO_SAFEHOUSE.z,
    radius: VALLEJO_SAFEHOUSE.radius
  },
  {
    id: 'sf-ferry-home',
    name: 'Ferry Building loft',
    district: 'sf',
    x: -780,
    z: -500,
    radius: 40,
    unlockDistrict: 'sf'
  },
  {
    id: 'marin-bridge-home',
    name: 'Marin bridge turn',
    district: 'marin',
    x: -1080,
    z: -320,
    radius: 44,
    unlockDistrict: 'marin'
  },
  {
    id: 'eastbay-merritt-home',
    name: 'Lake Merritt garage',
    district: 'eastBay',
    x: 620,
    z: -120,
    radius: 42,
    unlockDistrict: 'eastBay'
  },
  {
    id: 'peninsula-dumbarton-home',
    name: 'Dumbarton pull-off',
    district: 'peninsula',
    x: -40,
    z: -670,
    radius: 48,
    unlockDistrict: 'peninsula'
  },
  {
    id: 'southbay-ring-home',
    name: 'South Bay ring',
    district: 'southBay',
    x: 480,
    z: -1420,
    radius: 50,
    unlockDistrict: 'southBay'
  }
];

const MAX_CUSTOM = 5;

export function defaultHomeSafehouseId(): string {
  return 'vallejo-safehouse';
}

export function presetById(id: string): SafehousePreset | undefined {
  return PRESET_SAFEHOUSES.find((s) => s.id === id);
}

export function tryUnlockSafehousesForRegions(progress: SavedProgress): SavedProgress {
  const unlocked = new Set(progress.unlockedSafehouseIds);
  let changed = false;
  for (const preset of PRESET_SAFEHOUSES) {
    if (unlocked.has(preset.id)) continue;
    if (!preset.unlockDistrict) {
      if (progress.safehouseReached) {
        unlocked.add(preset.id);
        changed = true;
      }
      continue;
    }
    if (progress.unlockedRegionIds.includes(preset.unlockDistrict)) {
      unlocked.add(preset.id);
      changed = true;
    }
  }
  if (!progress.safehouseReached) return progress;
  if (!unlocked.has(defaultHomeSafehouseId())) {
    unlocked.add(defaultHomeSafehouseId());
    changed = true;
  }
  if (!changed) return progress;
  const next = { ...progress, unlockedSafehouseIds: [...unlocked] };
  saveProgress(next);
  return next;
}

export function ensureSafehouseUnlocks(progress: SavedProgress): SavedProgress {
  return tryUnlockSafehousesForRegions(progress);
}

export type ResolvedSafehouse = {
  id: string;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  radius: number;
  custom: boolean;
};

export function resolveHomeSafehouse(progress: SavedProgress): ResolvedSafehouse {
  return resolveSafehouseById(progress, progress.homeSafehouseId ?? defaultHomeSafehouseId());
}

export function resolveSafehouseById(progress: SavedProgress, id: string): ResolvedSafehouse {
  const custom = progress.customSafehouses.find((c) => c.id === id);
  if (custom) {
    return {
      id: custom.id,
      name: custom.name,
      district: custom.district,
      x: custom.x,
      z: custom.z,
      radius: 38,
      custom: true
    };
  }
  const preset = presetById(id) ?? presetById(defaultHomeSafehouseId())!;
  return { ...preset, custom: false };
}

export function homeSpawn(progress: SavedProgress): { x: number; y: number; z: number } {
  const home = resolveHomeSafehouse(progress);
  return {
    x: home.x,
    y: hillOffsetM(home.x, home.z) + 0.8,
    z: home.z + 14
  };
}

export function isNearSafehouse(px: number, pz: number, sh: ResolvedSafehouse): boolean {
  return Math.hypot(px - sh.x, pz - sh.z) < sh.radius + 12;
}

export function nearUnlockedSafehouse(
  progress: SavedProgress,
  px: number,
  pz: number
): { house: ResolvedSafehouse; atHome: boolean } | null {
  let best: { house: ResolvedSafehouse; d: number } | null = null;
  const home = resolveHomeSafehouse(progress);
  for (const id of progress.unlockedSafehouseIds) {
    const h = resolveSafehouseById(progress, id);
    const d = Math.hypot(px - h.x, pz - h.z);
    if (d > h.radius + 14) continue;
    if (!best || d < best.d) best = { house: h, d };
  }
  for (const c of progress.customSafehouses) {
    const h = resolveSafehouseById(progress, c.id);
    const d = Math.hypot(px - h.x, pz - h.z);
    if (d > h.radius + 14) continue;
    if (!best || d < best.d) best = { house: h, d };
  }
  if (!best) return null;
  const atHome = best.house.id === home.id;
  return { house: best.house, atHome };
}

export function setHomeSafehouse(progress: SavedProgress, id: string): SavedProgress {
  const can =
    progress.unlockedSafehouseIds.includes(id) || progress.customSafehouses.some((c) => c.id === id);
  if (!can) return progress;
  const next = { ...progress, homeSafehouseId: id };
  saveProgress(next);
  return next;
}

export function claimCustomSafehouse(
  progress: SavedProgress,
  name: string,
  x: number,
  z: number
): SavedProgress {
  if (progress.phase !== 'home') return progress;
  const district = districtAt(x, z) ?? 'vallejo';
  const label = name.trim().slice(0, 32) || 'Custom pull-off';
  let customs = [...progress.customSafehouses];
  const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
  if (customs.length >= MAX_CUSTOM) customs = customs.slice(0, MAX_CUSTOM - 1);
  const row: CustomSafehouse = { id, name: label, x, z, district, createdAt: Date.now() };
  customs = [row, ...customs];
  const next: SavedProgress = {
    ...progress,
    customSafehouses: customs,
    homeSafehouseId: id,
    unlockedSafehouseIds: progress.unlockedSafehouseIds.includes(id)
      ? progress.unlockedSafehouseIds
      : [...progress.unlockedSafehouseIds, id]
  };
  saveProgress(next);
  return next;
}

export function listSelectableSafehouses(progress: SavedProgress): ResolvedSafehouse[] {
  const out: ResolvedSafehouse[] = [];
  for (const id of progress.unlockedSafehouseIds) {
    const p = presetById(id);
    if (p) out.push({ ...p, custom: false });
  }
  for (const c of progress.customSafehouses) {
    out.push(resolveSafehouseById(progress, c.id));
  }
  return out;
}
