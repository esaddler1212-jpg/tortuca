import type { GameSettings } from './game-settings';

export type BayQualityPreset = 'chromebook' | 'balanced' | 'lush' | 'console';

export function applyBayQualityPreset(base: GameSettings, preset: BayQualityPreset): GameSettings {
  if (preset === 'chromebook') {
    return {
      ...base,
      bayQualityPreset: preset,
      fogQuality: 'low',
      showTraffic: true,
      showSideshow: true,
      hubStreamingEnabled: true,
      fuelSimEnabled: base.fuelSimEnabled,
      frameCapFps: 30,
      resolutionScale: 0.75
    };
  }
  if (preset === 'console') {
    return {
      ...base,
      bayQualityPreset: preset,
      fogQuality: 'med',
      showTraffic: true,
      showSideshow: true,
      hubStreamingEnabled: true,
      fuelSimEnabled: true,
      frameCapFps: 30,
      resolutionScale: 0.85,
      tvHudMode: true
    };
  }
  if (preset === 'lush') {
    return {
      ...base,
      bayQualityPreset: preset,
      fogQuality: 'high',
      showTraffic: true,
      showSideshow: true,
      hubStreamingEnabled: true,
      fuelSimEnabled: true
    };
  }
  return {
    ...base,
    bayQualityPreset: preset,
    fogQuality: 'med',
    showTraffic: true,
    showSideshow: true,
    hubStreamingEnabled: true
  };
}
