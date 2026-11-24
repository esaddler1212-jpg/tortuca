import type { BayQualityPreset } from './bay-quality';

import { FREEWAY_DRONE_BUDGET } from './freeway-traffic-drones';

/** Tier 6 — Vice ’86 “lived-in” read without new GLBs (neon + freeway silhouettes). */
export function freewayDroneBudget(
  preset: BayQualityPreset,
  vice86NeonRead: boolean
): number {
  const base = FREEWAY_DRONE_BUDGET[preset];
  if (!vice86NeonRead || preset === 'chromebook') return base;
  return Math.min(base + 2, 12);
}

export function storefrontEmissiveIntensity(vice86NeonRead: boolean): number {
  return vice86NeonRead ? 0.72 : 0.55;
}

export function hubParkingEmissiveIntensity(vice86NeonRead: boolean): number {
  return vice86NeonRead ? 0.38 : 0.25;
}