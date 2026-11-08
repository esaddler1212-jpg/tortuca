import type { GameSettings } from './game-settings';

export type BayQualityPreset = 'chromebook' | 'balanced' | 'lush';

export function applyBayQualityPreset(base: GameSettings, preset: BayQualityPreset): GameSettings {
  if (preset === 'chromebook') {
    return {
      ...base,
      bayQualityPreset: preset,
      fogQuality: 'low',
      showTraffic: false,
      showSideshow: false,
      fuelSimEnabled: base.fuelSimEnabled
    };
  }
  if (preset === 'lush') {
    return {
      ...base,
      bayQualityPreset: preset,
      fogQuality: 'high',
      showTraffic: true,
      showSideshow: true,
      fuelSimEnabled: true
    };
  }
  return {
    ...base,
    bayQualityPreset: preset,
    fogQuality: 'med',
    showTraffic: true,
    showSideshow: true
  };
}
