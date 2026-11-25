import type { QualityTier } from './quality-tier';
import { resetQualityProbeForTests } from './quality-tier';

const KEY = 'flight-nemulator-quality';
const AUTO_KEY = 'flight-nemulator-quality-auto-sampled';

export function qualityOverride(): QualityTier | null {
  const v = localStorage.getItem(KEY);
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return null;
}

export function setQualityOverride(tier: QualityTier | 'auto'): void {
  if (tier === 'auto') {
    localStorage.removeItem(KEY);
    localStorage.removeItem(AUTO_KEY);
    resetQualityProbeForTests();
  } else localStorage.setItem(KEY, tier);
}
