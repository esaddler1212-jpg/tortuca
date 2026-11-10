import type { AppBase, Entity } from 'playcanvas';

import type { BayQualityPreset } from './bay-quality';
import { pulseVehicleUnderglow } from './drive-feel';

const IDLE_EXPOSURE = 0.55;
const ZONE_EXPOSURE = 0.64;

export const IDLE_FOV: Record<BayQualityPreset, number> = {
  chromebook: 71,
  balanced: 72,
  lush: 74,
  console: 73
};

export const BOOST_FOV: Record<BayQualityPreset, number> = {
  chromebook: 77,
  balanced: 79,
  lush: 86,
  console: 80
};

function canvasEl(): HTMLCanvasElement | null {
  return document.getElementById('application-canvas') as HTMLCanvasElement | null;
}

/** Midnight Club Zone read — Lush gets exposure punch + canvas grade; all presets get FOV stretch. */
export function applyNitroZoneFeel(
  app: AppBase,
  camera: Entity,
  vehicle: Entity,
  boosting: boolean,
  dt: number,
  preset: BayQualityPreset
): void {
  const cam = camera.camera;
  if (!cam) return;

  const targetFov = boosting ? BOOST_FOV[preset] : IDLE_FOV[preset];
  cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 7.5);
  pulseVehicleUnderglow(vehicle, boosting);

  const zonePostFx = preset === 'lush' && boosting;
  if (preset === 'lush') {
    const targetExp = zonePostFx ? ZONE_EXPOSURE : IDLE_EXPOSURE;
    app.scene.exposure += (targetExp - app.scene.exposure) * Math.min(1, dt * 6);
    const el = canvasEl();
    if (el) {
      el.style.filter = zonePostFx ? 'brightness(1.08) contrast(1.06) saturate(1.18)' : '';
    }
  }
}

export function nitroZoneActive(preset: BayQualityPreset, boosting: boolean): boolean {
  return boosting && preset === 'lush';
}
