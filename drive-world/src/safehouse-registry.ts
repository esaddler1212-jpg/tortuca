import { hillOffsetM } from './bay-terrain';
import { VALLEJO_SAFEHOUSE } from './landmark-registry';
import type { CustomSafehouse, SavedProgress } from './game-progress';
import { saveProgress } from './game-progress';
import { districtAt } from './regional-weather';
import type { DistrictId } from './world-config';

export type DwellingKind = 'estate' | 'penthouse' | 'condo';

export type HomeServiceMode = 'valet' | 'garage';

export type HomeServicePoint = {
  x: number;
  z: number;
  y: number;
  mode: HomeServiceMode;
  pullRadius: number;
};

export type SafehousePreset = {
  id: string;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  radius: number;
  kind: DwellingKind;
  /** Unlock after clearing this region's landmarks */
  unlockDistrict?: DistrictId;
};

/** Legacy save IDs → current preset (same location semantics). */
const PRESET_ID_ALIASES: Record<string, string> = {
  'eastbay-merritt-home': 'oakland-penthouse'
};

export const PRESET_SAFEHOUSES: SafehousePreset[] = [
  {
    id: 'vallejo-safehouse',
    name: 'Vallejo estate · Fast & Furious garage',
    district: 'vallejo',
    x: VALLEJO_SAFEHOUSE.x,
    z: VALLEJO_SAFEHOUSE.z,
    radius: 52,
    kind: 'estate'
  },
  {
    id: 'sf-ferry-home',
    name: 'San Francisco penthouse',
    district: 'sf',
    x: -870,
    z: -300,
    radius: 40,
    kind: 'penthouse',
    unlockDistrict: 'sf'
  },
  {
    id: 'marin-bridge-home',
    name: 'Marin penthouse',
    district: 'marin',
    x: -1180,
    z: 320,
    radius: 44,
    kind: 'penthouse',
    unlockDistrict: 'marin'
  },
  {
    id: 'oakland-penthouse',
    name: 'Oakland penthouse',
    district: 'eastBay',
    x: 780,
    z: -200,
    radius: 42,
    kind: 'penthouse',
    unlockDistrict: 'eastBay'
  },
  {
    id: 'walnut-creek-penthouse',
    name: 'Walnut Creek penthouse',
    district: 'eastBay',
    x: 1105,
    z: 48,
    radius: 44,
    kind: 'penthouse',
    unlockDistrict: 'eastBay'
  },
  {
    id: 'napa-penthouse',
    name: 'Napa penthouse',
    district: 'vallejo',
    x: 720,
    z: 1380,
    radius: 46,
    kind: 'penthouse',
    unlockDistrict: 'vallejo'
  },
  {
    id: 'san-jose-penthouse',
    name: 'San José penthouse',
    district: 'southBay',
    x: 220,
    z: -1580,
    radius: 44,
    kind: 'penthouse',
    unlockDistrict: 'southBay'
  },
  {
    id: 'peninsula-dumbarton-home',
    name: 'Peninsula condo',
    district: 'peninsula',
    x: -40,
    z: -670,
    radius: 42,
    kind: 'condo',
    unlockDistrict: 'peninsula'
  },
  {
    id: 'southbay-condo',
    name: 'South Bay condo',
    district: 'southBay',
    x: 480,
    z: -1420,
    radius: 44,
    kind: 'condo',
    unlockDistrict: 'southBay'
  },
  {
    id: 'eastbay-condo',
    name: 'East Bay condo',
    district: 'eastBay',
    x: 1035,
    z: 102,
    radius: 42,
    kind: 'condo',
    unlockDistrict: 'eastBay'
  }
];

const MAX_CUSTOM = 5;

/** Cities that use a regional penthouse preset — custom claims here are condos. */
const PENTHOUSE_CITY_HINTS: { label: string; x: number; z: number; r: number }[] = [
  { label: 'San Francisco', x: -870, z: -300, r: 520 },
  { label: 'Oakland', x: 620, z: -120, r: 380 },
  { label: 'Walnut Creek', x: 1105, z: 48, r: 200 },
  { label: 'Marin', x: -1180, z: 320, r: 450 },
  { label: 'Napa', x: 720, z: 1380, r: 280 },
  { label: 'San José', x: 220, z: -1580, r: 320 }
];

/** Where you stop to open fleet / tuning — valet for penthouses, garage door for everything else. */
export function homeServicePoint(sh: ResolvedSafehouse): HomeServicePoint {
  const baseY = hillOffsetM(sh.x, sh.z);
  if (sh.kind === 'penthouse') {
    return {
      x: sh.x + 18,
      z: sh.z + 28,
      y: baseY + 0.35,
      mode: 'valet',
      pullRadius: 26
    };
  }
  const doorInset = sh.kind === 'estate' ? 26 : 20;
  return {
    x: sh.x,
    z: sh.z + doorInset,
    y: baseY + 0.35,
    mode: 'garage',
    pullRadius: 24
  };
}

export function isAtHomeService(sh: ResolvedSafehouse, px: number, pz: number): boolean {
  const svc = homeServicePoint(sh);
  return Math.hypot(px - svc.x, pz - svc.z) <= svc.pullRadius;
}

export function homeServiceHint(mode: HomeServiceMode): string {
  return mode === 'valet' ? 'Pull up to the valet stand' : 'Pull up to the garage door';
}

export function dwellingKindLabel(kind: DwellingKind): string {
  switch (kind) {
    case 'estate':
      return 'Estate';
    case 'penthouse':
      return 'Penthouse';
    default:
      return 'Condo';
  }
}

export function suggestCustomCondoName(x: number, z: number): string {
  for (const hint of PENTHOUSE_CITY_HINTS) {
    if (Math.hypot(x - hint.x, z - hint.z) < hint.r) {
      return `${hint.label} condo`;
    }
  }
  const district = districtAt(x, z);
  if (district === 'vallejo') return 'North Bay condo';
  if (district) return `${districtLabelForCondo(district)} condo`;
  return 'Bay Area condo';
}

function districtLabelForCondo(district: DistrictId): string {
  switch (district) {
    case 'sf':
      return 'San Francisco';
    case 'eastBay':
      return 'East Bay';
    case 'southBay':
      return 'South Bay';
    case 'peninsula':
      return 'Peninsula';
    case 'marin':
      return 'Marin';
    case 'vallejo':
      return 'Vallejo';
    default:
      return 'Bay Area';
  }
}

export function defaultHomeSafehouseId(): string {
  return 'vallejo-safehouse';
}

export function presetById(id: string): SafehousePreset | undefined {
  const resolved = PRESET_ID_ALIASES[id] ?? id;
  return PRESET_SAFEHOUSES.find((s) => s.id === resolved);
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
  const migratedUnlocks = [...unlocked].map((id) => PRESET_ID_ALIASES[id] ?? id);
  const uniqUnlocks = [...new Set(migratedUnlocks)];
  if (uniqUnlocks.length !== progress.unlockedSafehouseIds.length) changed = true;
  for (const id of uniqUnlocks) {
    if (!progress.unlockedSafehouseIds.includes(id)) changed = true;
  }

  let homeId = progress.homeSafehouseId ?? defaultHomeSafehouseId();
  if (PRESET_ID_ALIASES[homeId]) homeId = PRESET_ID_ALIASES[homeId];
  if (homeId !== progress.homeSafehouseId) changed = true;

  if (!changed) return progress;
  const next: SavedProgress = {
    ...progress,
    homeSafehouseId: homeId,
    unlockedSafehouseIds: uniqUnlocks
  };
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
  kind: DwellingKind;
  custom: boolean;
};

export function resolveHomeSafehouse(progress: SavedProgress): ResolvedSafehouse {
  const id = PRESET_ID_ALIASES[progress.homeSafehouseId ?? ''] ?? progress.homeSafehouseId;
  return resolveSafehouseById(progress, id ?? defaultHomeSafehouseId());
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
      kind: 'condo',
      custom: true
    };
  }
  const alias = PRESET_ID_ALIASES[id] ?? id;
  const preset = presetById(alias) ?? presetById(defaultHomeSafehouseId())!;
  return { ...preset, custom: false };
}

export function homeSpawn(progress: SavedProgress): { x: number; y: number; z: number } {
  const home = resolveHomeSafehouse(progress);
  const svc = homeServicePoint(home);
  const pullBack = home.kind === 'penthouse' ? 14 : 12;
  return {
    x: svc.x,
    y: svc.y + 0.55,
    z: svc.z + pullBack
  };
}

export function isNearSafehouse(px: number, pz: number, sh: ResolvedSafehouse): boolean {
  const pad = sh.kind === 'estate' ? 16 : 12;
  return Math.hypot(px - sh.x, pz - sh.z) < sh.radius + pad;
}

export function nearUnlockedSafehouse(
  progress: SavedProgress,
  px: number,
  pz: number
): { house: ResolvedSafehouse; atHome: boolean } | null {
  let best: { house: ResolvedSafehouse; d: number } | null = null;
  const home = resolveHomeSafehouse(progress);
  for (const id of progress.unlockedSafehouseIds) {
    const resolvedId = PRESET_ID_ALIASES[id] ?? id;
    const h = resolveSafehouseById(progress, resolvedId);
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
  const atHome = best.house.id === home.id && isAtHomeService(home, px, pz);
  return { house: best.house, atHome };
}

export function setHomeSafehouse(progress: SavedProgress, id: string): SavedProgress {
  const resolved = PRESET_ID_ALIASES[id] ?? id;
  const can =
    progress.unlockedSafehouseIds.includes(id) ||
    progress.unlockedSafehouseIds.includes(resolved) ||
    progress.customSafehouses.some((c) => c.id === id);
  if (!can) return progress;
  const next = { ...progress, homeSafehouseId: resolved };
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
  const trimmed = name.trim();
  const label = (trimmed || suggestCustomCondoName(x, z)).slice(0, 32);
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
  const seen = new Set<string>();
  const out: ResolvedSafehouse[] = [];
  for (const id of progress.unlockedSafehouseIds) {
    const resolvedId = PRESET_ID_ALIASES[id] ?? id;
    if (seen.has(resolvedId)) continue;
    const p = presetById(resolvedId);
    if (p) {
      seen.add(resolvedId);
      out.push({ ...p, custom: false });
    }
  }
  for (const c of progress.customSafehouses) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(resolveSafehouseById(progress, c.id));
  }
  return out;
}
