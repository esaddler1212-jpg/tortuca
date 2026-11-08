import type { AutopilotPreset } from './autopilot-cruise';
import type { MusicStationId } from './game-music';

export type GameSettings = {
  masterVolume: number;
  fogQuality: 'low' | 'med' | 'high';
  showTraffic: boolean;
  photoSensitivity: number;
  musicVolume: number;
  musicStation: MusicStationId;
  musicEnabled: boolean;
  musicUsePlaylist: boolean;
  autopilotPreset: AutopilotPreset;
};

const KEY = 'drive-world-settings-v1';

const defaults: GameSettings = {
  masterVolume: 0.85,
  fogQuality: 'med',
  showTraffic: true,
  photoSensitivity: 1,
  musicVolume: 0.55,
  musicStation: 'ambient',
  musicEnabled: true,
  musicUsePlaylist: false,
  autopilotPreset: 'tour'
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...(JSON.parse(raw) as GameSettings) };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s: GameSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
