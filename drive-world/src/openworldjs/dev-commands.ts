/**
 * Debug console commands — pattern from OpenWorldJS PlayerInputHandler (run0/run1).
 * Active when URL has `cnDebug` or `openworldDebug`.
 */
import type { GameSettings } from '../game-settings';
import { loadSettings, saveSettings } from '../game-settings';

export type OpenworldDebugState = {
  trafficFast: boolean;
};

let state: OpenworldDebugState = { trafficFast: false };

export function openworldDebugState(): OpenworldDebugState {
  return state;
}

function applyTrafficPreset(fast: boolean): void {
  state = { ...state, trafficFast: fast };
  const base = loadSettings();
  const next: GameSettings = {
    ...base,
    showTraffic: true,
    bayQualityPreset: fast ? 'lush' : base.bayQualityPreset
  };
  saveSettings(next);
  window.dispatchEvent(new CustomEvent('drive-world:settings', { detail: next }));
  console.info(`[openworld] trafficFast=${fast}`);
}

const COMMANDS: Record<string, () => void> = {
  run0: () => applyTrafficPreset(false),
  run1: () => applyTrafficPreset(true),
  maze: () => console.info('[openworld] Vallejo maze is baked at boot (non-Chromebook presets)'),
  help: () =>
    console.info('[openworld] commands: run0, run1, maze, help (OpenWorldJS-inspired debug)')
};

export function installOpenworldDevCommands(): void {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('cnDebug') && !params.has('openworldDebug')) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'openworld cmd (help)';
  input.style.cssText =
    'position:fixed;top:8px;right:8px;z-index:9999;width:11rem;font-size:12px;opacity:0.85;';
  document.body.appendChild(input);

  input.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    const cmd = input.value.trim().toLowerCase();
    input.value = '';
    const fn = COMMANDS[cmd];
    if (fn) fn();
    else console.warn(`[openworld] unknown command "${cmd}" — try help`);
  });

  (window as unknown as { __cityNightsOpenWorld?: unknown }).__cityNightsOpenWorld = {
    commands: Object.keys(COMMANDS),
    state: () => openworldDebugState()
  };
}
