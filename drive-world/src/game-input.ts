import { computeTouchControls, isTouchDriveActive } from './game-bridge';

export type DriveInput = { steering: number; throttle: number; nitro: boolean; vertical: number };

let shiftDown = false;
const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  climb: false,
  descend: false
};

export function bindDriveKeys(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') shiftDown = true;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = true;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      keys.climb = true;
    }
    if (e.key === 'Control') keys.descend = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') shiftDown = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
    if (e.key === ' ' || e.key === 'Spacebar') keys.climb = false;
    if (e.key === 'Control') keys.descend = false;
  });
}

function keyboardAxes(): { steering: number; throttle: number; vertical: number } {
  let steering = 0;
  let throttle = 0;
  let vertical = 0;
  if (keys.left) steering++;
  if (keys.right) steering--;
  if (keys.up) throttle++;
  if (keys.down) throttle--;
  if (keys.climb) vertical++;
  if (keys.descend) vertical--;
  return { steering, throttle, vertical };
}

export function pollDriveInput(): DriveInput {
  const kb = keyboardAxes();
  if (isTouchDriveActive()) {
    const t = computeTouchControls();
    return { steering: t.steering, throttle: t.throttle, nitro: shiftDown || t.nitro, vertical: t.vertical };
  }
  const gp = navigator.getGamepads?.()[0];
  let steering = kb.steering;
  let throttle = kb.throttle;
  let vertical = kb.vertical;
  if (gp) {
    const ax = gp.axes[0] ?? 0;
    const gas = -(gp.axes[1] ?? 0);
    const brake = gp.axes[3] ?? gp.axes[2] ?? 0;
    if (Math.abs(ax) > 0.15) steering = -Math.max(-1, Math.min(1, ax));
    if (gas > 0.2) throttle = 1;
    else if (brake > 0.2) throttle = -1;
    if (gp.buttons[4]?.pressed) vertical += 1;
    if (gp.buttons[5]?.pressed) vertical -= 1;
  }
  const nitro = shiftDown || gp?.buttons[7]?.pressed || (gp?.buttons[7]?.value ?? 0) > 0.5;
  if (!gp && !isTouchDriveActive()) {
    return { steering, throttle, nitro: shiftDown, vertical };
  }
  return { steering, throttle, nitro: !!nitro, vertical };
}

/** @deprecated Ground cars still read WASD via vehicleControls; use pollDriveInput for aircraft. */
export function pollGamepadInput(): DriveInput {
  return pollDriveInput();
}

export function isShiftNitro(): boolean {
  return shiftDown;
}
