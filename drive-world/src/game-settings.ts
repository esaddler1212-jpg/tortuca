export type GameSettings = {
  masterVolume: number;
  fogQuality: 'low' | 'med' | 'high';
  showTraffic: boolean;
  photoSensitivity: number;
};

const KEY = 'drive-world-settings-v1';

const defaults: GameSettings = {
  masterVolume: 0.85,
  fogQuality: 'med',
  showTraffic: true,
  photoSensitivity: 1
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
