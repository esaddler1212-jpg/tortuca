import type { AutopilotPreset } from './autopilot-cruise';
import type { BayQualityPreset } from './bay-quality';
import type { MusicStationId } from './game-music';
import { isTouchPrimary } from './mobile-platform';

export type GameSettings = {
  masterVolume: number;
  /** Quick preset — fog, traffic, sideshow, fuel */
  bayQualityPreset: BayQualityPreset;
  fogQuality: 'low' | 'med' | 'high';
  /** Gentle tank drain + free pumps; off = always full power */
  fuelSimEnabled: boolean;
  showTraffic: boolean;
  showSideshow: boolean;
  /** Defer distant hub blocks; show skyline shells until you approach */
  hubStreamingEnabled: boolean;
  photoSensitivity: number;
  musicVolume: number;
  musicStation: MusicStationId;
  musicEnabled: boolean;
  musicUsePlaylist: boolean;
  autopilotPreset: AutopilotPreset;
  /** SF/Marin mist + wet-road mood */
  coastalWeatherEnabled: boolean;
  /** Anonymous session length rollups (no PII) */
  shareSessionStats: boolean;
  /** SFX stings + engine gain (music has musicVolume) */
  sfxVolume: number;
  /** 0 = uncapped; 30 / 60 caps sim step via maxDeltaTime */
  frameCapFps: 0 | 30 | 60;
  /** Multiplier on device pixel ratio (performance / TV) */
  resolutionScale: number;
  /** Larger HUD type for TV / couch */
  tvHudMode: boolean;
};

const KEY = 'drive-world-settings-v1';

const defaults: GameSettings = {
  masterVolume: 0.85,
  bayQualityPreset: 'balanced',
  fogQuality: 'med',
  fuelSimEnabled: true,
  showTraffic: true,
  showSideshow: true,
  hubStreamingEnabled: true,
  photoSensitivity: 1,
  musicVolume: 0.55,
  musicStation: 'ambient',
  musicEnabled: true,
  musicUsePlaylist: false,
  autopilotPreset: 'tour',
  coastalWeatherEnabled: true,
  shareSessionStats: true,
  sfxVolume: 0.9,
  frameCapFps: 0,
  resolutionScale: 1,
  tvHudMode: false
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const base = { ...defaults };
      if (isTouchPrimary()) base.fogQuality = 'low';
      return base;
    }
    return { ...defaults, ...(JSON.parse(raw) as GameSettings) };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s: GameSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
