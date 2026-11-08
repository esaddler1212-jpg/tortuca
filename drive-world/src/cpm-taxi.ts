import type { DistrictId } from './world-config';
import type { SavedProgress } from './game-progress';

export type TaxiContract = {
  id: string;
  label: string;
  district: DistrictId;
  pickupX: number;
  pickupZ: number;
  pickupRadius: number;
  dropX: number;
  dropZ: number;
  dropRadius: number;
  payHint: string;
};

export type TaxiRuntime = {
  activeId: string | null;
  pickedUp: boolean;
};

export function freshTaxiRuntime(): TaxiRuntime {
  return { activeId: null, pickedUp: false };
}

export function nextTaxiContract(progress: SavedProgress, district?: DistrictId): TaxiContract | null {
  const done = new Set(progress.taxiCompletedIds);
  for (const c of TAXI_CONTRACTS) {
    if (district && c.district !== district) continue;
    if (done.has(c.id)) continue;
    return c;
  }
  return null;
}

export function tickTaxiContract(
  rt: TaxiRuntime,
  progress: SavedProgress,
  px: number,
  pz: number,
  mph: number
): { rt: TaxiRuntime; progress: SavedProgress; toast?: { title: string; body: string } } {
  if (!rt.activeId) {
    const offer = nextTaxiContract(progress);
    if (!offer) return { rt, progress };
    return { rt, progress };
  }
  const c = TAXI_CONTRACTS.find((x) => x.id === rt.activeId);
  if (!c) return { rt: freshTaxiRuntime(), progress };
  const atPickup = Math.hypot(px - c.pickupX, pz - c.pickupZ) <= c.pickupRadius;
  const atDrop = Math.hypot(px - c.dropX, pz - c.dropZ) <= c.dropRadius;
  if (!rt.pickedUp && atPickup && mph < 8) {
    return {
      rt: { ...rt, pickedUp: true },
      progress,
      toast: { title: 'Courier', body: `Picked up — deliver to ${c.payHint}` }
    };
  }
  if (rt.pickedUp && atDrop && mph < 10) {
    const ids = progress.taxiCompletedIds.includes(c.id)
      ? progress.taxiCompletedIds
      : [...progress.taxiCompletedIds, c.id];
    return {
      rt: freshTaxiRuntime(),
      progress: { ...progress, taxiCompletedIds: ids, activeTaxiId: null },
      toast: { title: 'Courier paid', body: c.label }
    };
  }
  return { rt, progress };
}

export const TAXI_CONTRACTS: TaxiContract[] = [
  {
    id: 'taxi-mare-pumps',
    label: 'Mare Island → estate pumps',
    district: 'vallejo',
    pickupX: 444,
    pickupZ: 1020,
    pickupRadius: 32,
    dropX: 518,
    dropZ: 932,
    dropRadius: 28,
    payHint: 'Harbor parts run'
  },
  {
    id: 'taxi-helipad-taco',
    label: 'Helipad → taco truck',
    district: 'vallejo',
    pickupX: 540,
    pickupZ: 920,
    pickupRadius: 30,
    dropX: 478,
    dropZ: 968,
    dropRadius: 26,
    payHint: 'Late-night crew meal'
  },
  {
    id: 'taxi-carquinez-safe',
    label: 'Carquinez → safehouse',
    district: 'vallejo',
    pickupX: 520,
    pickupZ: 1180,
    pickupRadius: 34,
    dropX: 500,
    dropZ: 900,
    dropRadius: 40,
    payHint: 'Bridge toll hop'
  },
  {
    id: 'taxi-emery-pixar',
    label: 'Bay St → Pixar campus',
    district: 'eastBay',
    pickupX: 598,
    pickupZ: -248,
    pickupRadius: 36,
    dropX: 548,
    dropZ: -278,
    dropRadius: 32,
    payHint: 'Render farm late shift'
  },
  {
    id: 'taxi-lake-fox',
    label: 'Lake Merritt → Fox Theater',
    district: 'eastBay',
    pickupX: 658,
    pickupZ: -188,
    pickupRadius: 38,
    dropX: 598,
    dropZ: -358,
    dropRadius: 30,
    payHint: 'Show night drop'
  }
];

// fix typo pickupZ duplicated - I'll fix in file