import type { Entity } from 'playcanvas';

/** Midnight Club–style nitro underglow pulse while boosting. */
export function pulseVehicleUnderglow(vehicle: Entity, boosting: boolean): void {
  const glow = vehicle.findByName('underglow') as Entity | null;
  if (!glow?.light) return;
  const pulse = boosting ? Math.sin(performance.now() * 0.015) * 1.4 : 0;
  glow.light.intensity = (boosting ? 4.2 : 2.4) + pulse;
}

/** Forza-style FOV stretch on nitro. */
export function applyCameraFovBoost(camera: Entity, boosting: boolean, dt: number): void {
  const cam = camera.camera;
  if (!cam) return;
  const target = boosting ? 79 : 72;
  cam.fov += (target - cam.fov) * Math.min(1, dt * 7.5);
}
