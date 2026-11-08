import { appliedTuning } from './vehicle-customization';
import type { VehicleCustomization } from './vehicle-customization';
import type { VehicleSpec } from './vehicle-catalog';

export type DynoSheet = {
  crankHp: number;
  wheelHp: number;
  torqueLbFt: number;
  zeroToSixtySec: number;
  quarterMiHint: string;
};

export function dynoSheet(spec: VehicleSpec, custom: VehicleCustomization): DynoSheet {
  const tune = appliedTuning(spec, custom);
  const crankHp = Math.round(110 + custom.power * 185 + tune.maxEngineForce * 0.028 + custom.spoiler * 12);
  const wheelHp = Math.round(crankHp * (0.86 + custom.grip * 0.06));
  const torqueLbFt = Math.round(140 + custom.power * 220 + tune.maxEngineForce * 0.022);
  const zeroToSixtySec = Math.max(3.8, 9.2 - custom.power * 3.8 - tune.maxEngineForce * 0.00045);
  const quarterMiHint =
    custom.handling === 'drift'
      ? 'Loose — add grip for trap speed'
      : custom.power > 0.75
        ? 'Short-shift before the bridge'
        : 'Roll out smooth';
  return { crankHp, wheelHp, torqueLbFt, zeroToSixtySec, quarterMiHint };
}
