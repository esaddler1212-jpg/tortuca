import type { VehicleSpec } from './vehicle-catalog';

export type HandlingPreset = 'grip' | 'drift' | 'comfort';
export type ExhaustNote = 'stock' | 'sport' | 'loud';

export type VehicleCustomization = {
  paintPreset: string;
  glow: number;
  power: number;
  grip: number;
  wheel: number;
  /** 0–1 chassis lower */
  rideHeight: number;
  /** 0–1 underglow intensity */
  underglow: number;
  /** 0–1 window tint */
  tint: number;
  /** 0–1 rim accent */
  rims: number;
  /** 0–1 negative camber look + slight turn-in */
  camber: number;
  /** 0–1 rear wing size */
  spoiler: number;
  /** 0–1 secondary body stripe */
  liveryStripe: number;
  exhaustNote: ExhaustNote;
  handling: HandlingPreset;
};

export type PaintPreset = {
  id: string;
  label: string;
  diffuse: [number, number, number];
  emissive: [number, number, number];
};

export const PAINT_PRESETS: PaintPreset[] = [
  { id: 'bay-blue', label: 'Bay Blue', diffuse: [0.08, 0.14, 0.22], emissive: [0.2, 0.45, 0.85] },
  { id: 'fog-white', label: 'Fog White', diffuse: [0.55, 0.58, 0.62], emissive: [0.7, 0.75, 0.85] },
  { id: 'bridge-orange', label: 'Bridge Orange', diffuse: [0.2, 0.08, 0.04], emissive: [0.78, 0.28, 0.1] },
  { id: 'neon-cyan', label: 'Neon Cyan', diffuse: [0.06, 0.12, 0.14], emissive: [0.15, 0.85, 0.95] },
  { id: 'cherry-red', label: 'Cherry Red', diffuse: [0.18, 0.05, 0.05], emissive: [0.9, 0.18, 0.12] },
  { id: 'stealth', label: 'Stealth', diffuse: [0.04, 0.04, 0.05], emissive: [0.12, 0.14, 0.18] },
  { id: 'warriors-blue', label: 'Warriors Blue', diffuse: [0.06, 0.12, 0.28], emissive: [0.15, 0.45, 0.95] },
  { id: 'giants-orange', label: 'Giants Orange', diffuse: [0.22, 0.1, 0.04], emissive: [0.95, 0.4, 0.12] },
  { id: 'parking-yellow', label: 'Lot Stripe Yellow', diffuse: [0.2, 0.16, 0.04], emissive: [0.95, 0.85, 0.15] },
  { id: 'fuel-green', label: 'Pump Green', diffuse: [0.05, 0.12, 0.06], emissive: [0.25, 0.92, 0.45] }
];

export const DEFAULT_CUSTOMIZATION: VehicleCustomization = {
  paintPreset: 'bay-blue',
  glow: 0.45,
  power: 0.55,
  grip: 0.5,
  wheel: 0.5,
  rideHeight: 0.5,
  underglow: 0.35,
  tint: 0.4,
  rims: 0.45,
  camber: 0.25,
  spoiler: 0.35,
  liveryStripe: 0.2,
  exhaustNote: 'stock',
  handling: 'grip'
};

export function mergeCustomization(saved?: Partial<VehicleCustomization>): VehicleCustomization {
  return { ...DEFAULT_CUSTOMIZATION, ...saved };
}

export function defaultCustomizationFor(spec: VehicleSpec): VehicleCustomization {
  if (spec.id === 'bonus-gotham-knight') {
    return {
      ...DEFAULT_CUSTOMIZATION,
      paintPreset: 'stealth',
      glow: 0.82,
      power: 0.92,
      grip: 0.72,
      underglow: 0.78,
      rims: 0.35,
      handling: 'grip'
    };
  }
  if (spec.id === 'bonus-scarlet-five') {
    return {
      ...DEFAULT_CUSTOMIZATION,
      paintPreset: 'fog-white',
      glow: 0.42,
      power: 0.88,
      grip: 0.62,
      rims: 0.75,
      handling: 'grip'
    };
  }
  const match = PAINT_PRESETS.find(
    (p) =>
      Math.abs(p.emissive[0] - spec.paint.emissive[0]) < 0.15 &&
      Math.abs(p.emissive[1] - spec.paint.emissive[1]) < 0.15
  );
  return {
    ...DEFAULT_CUSTOMIZATION,
    paintPreset: match?.id ?? 'bay-blue',
    glow: Math.min(1, Math.max(0, spec.paint.emissiveIntensity / 0.5))
  };
}

export function resolvePaintPreset(id: string): PaintPreset {
  return PAINT_PRESETS.find((p) => p.id === id) ?? PAINT_PRESETS[0];
}

export function appliedTuning(spec: VehicleSpec, custom: VehicleCustomization): {
  maxEngineForce: number;
  frictionSlip: number;
  emissiveIntensity: number;
  diffuse: [number, number, number];
  emissive: [number, number, number];
  wheelScale: number;
  maxSteering: number;
  rideDrop: number;
  underglowIntensity: number;
  tintOpacity: number;
  rimGlow: number;
  camberDeg: number;
  spoilerScale: number;
  stripeIntensity: number;
  exhaustGain: number;
} {
  const preset = resolvePaintPreset(custom.paintPreset);
  const powerMul = 0.85 + custom.power * 0.4;
  let friction = 920 + custom.grip * 520;
  let steering = spec.maxSteering;
  let power = spec.maxEngineForce * powerMul;
  if (custom.handling === 'drift') {
    friction *= 0.82;
    steering *= 1.12;
    power *= 1.05;
  } else if (custom.handling === 'comfort') {
    friction *= 1.08;
    steering *= 0.92;
    power *= 0.95;
  }
  const glow = 0.15 + custom.glow * 0.65;
  const wheelScale = 0.88 + custom.wheel * 0.28;
  const rideDrop = custom.rideHeight * 0.22;
  const camberDeg = -4 - custom.camber * 10;
  if (custom.camber > 0.45) friction *= 1.03;
  const exhaustGain = custom.exhaustNote === 'loud' ? 1.45 : custom.exhaustNote === 'sport' ? 1.15 : 1;
  return {
    maxEngineForce: power,
    frictionSlip: friction,
    emissiveIntensity: glow,
    diffuse: preset.diffuse,
    emissive: preset.emissive,
    wheelScale,
    maxSteering: steering,
    rideDrop,
    underglowIntensity: custom.underglow,
    tintOpacity: 0.35 + custom.tint * 0.45,
    rimGlow: 0.2 + custom.rims * 0.8,
    camberDeg,
    spoilerScale: 0.4 + custom.spoiler * 1.1,
    stripeIntensity: custom.liveryStripe,
    exhaustGain
  };
}

export const COLLECTIBLE_PAINTS = ['warriors-blue', 'giants-orange'] as const;
