export type QualityTier = 'low' | 'medium' | 'high';

import { qualityOverride } from './game-settings';

export function detectQualityTier(): QualityTier {
  const forced = qualityOverride();
  if (forced) return forced;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse && mem <= 4) return 'low';
  if (cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

export function debrisEnabled(tier: QualityTier): boolean {
  return tier !== 'low';
}

export function particlesLite(tier: QualityTier): boolean {
  return tier === 'high';
}
