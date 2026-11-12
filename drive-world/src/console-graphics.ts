import type { AppBase } from 'playcanvas';

import type { GameSettings } from './game-settings';

let simPauseDepth = 0;
let renderCap = 0;
let renderAccum = 0;
let lastFrameMs = 0;

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
  renderCap = readFrameCap(settings);
  renderAccum = 0;
  app.autoRender = renderCap === 0;
  if (renderCap === 0) app.renderNextFrame = true;
}

/** Render pacing: simulation still ticks every rAF; GPU only draws at the capped rate. */
export function installRenderCap(app: AppBase): void {
  app.on('update', () => {
    if (renderCap === 0) return;
    const now = performance.now();
    const realDt = lastFrameMs ? (now - lastFrameMs) / 1000 : 0;
    lastFrameMs = now;
    renderAccum += realDt;
    const step = 1 / renderCap;
    if (renderAccum >= step * 0.98) {
      renderAccum = Math.min(renderAccum - step, step);
      app.renderNextFrame = true;
    }
  });
}

export function setSimulationPaused(paused: boolean): void {
  simPauseDepth = paused ? 1 : 0;
}

export function isSimulationPaused(): boolean {
  return simPauseDepth > 0;
}
