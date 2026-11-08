import type { AppBase } from 'playcanvas';

import type { GameSettings } from './game-settings';

let simPauseDepth = 0;

export function readFrameCap(settings: GameSettings): number {
  const cap = settings.frameCapFps ?? 0;
  if (cap === 30 || cap === 60) return cap;
  return 0;
}

export function applyResolutionScale(
  device: { maxPixelRatio: number },
  settings: GameSettings,
  basePixelRatio: number
): void {
  const scale = Math.max(0.5, Math.min(1, settings.resolutionScale ?? 1));
  device.maxPixelRatio = Math.min(2, basePixelRatio * scale);
}

export function applyFrameCap(app: AppBase, settings: GameSettings): void {
  const cap = readFrameCap(settings);
  if (cap === 30) app.maxDeltaTime = 1 / 30;
  else if (cap === 60) app.maxDeltaTime = 1 / 60;
  else app.maxDeltaTime = 0;
}

export function setSimulationPaused(paused: boolean): void {
  simPauseDepth += paused ? 1 : -1;
  if (simPauseDepth < 0) simPauseDepth = 0;
}

export function isSimulationPaused(): boolean {
  return simPauseDepth > 0;
}
