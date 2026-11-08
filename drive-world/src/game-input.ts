import { computeTouchControls, isTouchDriveActive } from './game-bridge';

export type DriveInput = { steering: number; throttle: number; nitro: boolean };

let shiftDown = false;

export function bindDriveKeys(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') shiftDown = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') shiftDown = false;
  });
}

export function pollGamepadInput(): DriveInput {
  const empty: DriveInput = { steering: 0, throttle: 0, nitro: shiftDown };
  if (isTouchDriveActive()) {
    const t = computeTouchControls();
    return { steering: t.steering, throttle: t.throttle, nitro: shiftDown };
  }
  const gp = navigator.getGamepads?.()[0];
  if (!gp) return empty;
  let steering = 0;
  let throttle = 0;
  const ax = gp.axes[0] ?? 0;
  const gas = -(gp.axes[1] ?? 0);
  const brake = gp.axes[3] ?? gp.axes[2] ?? 0;
  if (Math.abs(ax) > 0.15) steering = -Math.max(-1, Math.min(1, ax));
  if (gas > 0.2) throttle = 1;
  else if (brake > 0.2) throttle = -1;
  const nitro = shiftDown || gp.buttons[5]?.pressed || gp.buttons[7]?.value > 0.5;
  return { steering, throttle, nitro };
}

export function isShiftNitro(): boolean {
  return shiftDown;
}
