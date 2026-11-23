import type { QualityTier } from './quality-tier';

const KEY = 'flight-nemulator-quality';

export function qualityOverride(): QualityTier | null {
  const v = localStorage.getItem(KEY);
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return null;
}

export function setQualityOverride(tier: QualityTier | 'auto'): void {
  if (tier === 'auto') localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, tier);
}
