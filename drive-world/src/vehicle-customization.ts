import type { VehicleSpec } from './vehicle-catalog';

export type VehicleCustomization = {
  paintPreset: string;
  /** 0–1 night glow on body */
  glow: number;
  /** 0–1 → engine force multiplier */
  power: number;
  /** 0–1 → wheel friction */
  grip: number;
  /** 0–1 → wheel radius scale */
  wheel: number;
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
  { id: 'stealth', label: 'Stealth', diffuse: [0.04, 0.04, 0.05], emissive: [0.12, 0.14, 0.18] }
];

export const DEFAULT_CUSTOMIZATION: VehicleCustomization = {
  paintPreset: 'bay-blue',
  glow: 0.45,
  power: 0.55,
  grip: 0.5,
  wheel: 0.5
};

export function defaultCustomizationFor(spec: VehicleSpec): VehicleCustomization {
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
} {
  const preset = resolvePaintPreset(custom.paintPreset);
  const powerMul = 0.85 + custom.power * 0.4;
  const friction = 920 + custom.grip * 520;
  const glow = 0.15 + custom.glow * 0.65;
  const wheelScale = 0.88 + custom.wheel * 0.28;
  return {
    maxEngineForce: spec.maxEngineForce * powerMul,
    frictionSlip: friction,
    emissiveIntensity: glow,
    diffuse: preset.diffuse,
    emissive: preset.emissive,
    wheelScale
  };
}
