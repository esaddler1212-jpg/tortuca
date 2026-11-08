import { computeTouchFlight, isTouchActive } from './game-bridge';

export type FlightInput = {
  pitch: number;
  yaw: number;
  roll: number;
  throttle: number;
  vertical: number;
  boost: boolean;
  primary: boolean;
  throw: boolean;
  super: boolean;
  photo: boolean;
};

const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  climb: false,
  descend: false,
  boost: false,
  primary: false,
  throw: false,
  super: false
};

let primaryPulse = false;
let throwPulse = false;
let superPulse = false;
let photoPulse = false;

export function bindFlightKeys(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = true;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      keys.climb = true;
    }
    if (e.key === 'Control') keys.descend = true;
    if (e.key === 'Shift') keys.boost = true;
    if (e.key === 'f' || e.key === 'F') {
      primaryPulse = true;
    }
    if (e.key === 'q' || e.key === 'Q') throwPulse = true;
    if (e.key === 'e' || e.key === 'E') superPulse = true;
    if (e.key === 'p' || e.key === 'P') photoPulse = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
    if (e.key === ' ' || e.key === 'Spacebar') keys.climb = false;
    if (e.key === 'Control') keys.descend = false;
    if (e.key === 'Shift') keys.boost = false;
  });
}

export function pollFlightInput(): FlightInput {
  let yaw = 0;
  let pitch = 0;
  let vertical = 0;
  let throttle = 0.85;
  if (keys.left) yaw += 1;
  if (keys.right) yaw -= 1;
  if (keys.up) pitch += 1;
  if (keys.down) pitch -= 1;
  if (keys.climb) vertical += 1;
  if (keys.descend) vertical -= 1;
  if (keys.up || keys.down) throttle = 1;

  const gp = navigator.getGamepads?.()[0];
  let boost = keys.boost;
  if (gp) {
    const ax0 = gp.axes[0] ?? 0;
    const ax1 = gp.axes[1] ?? 0;
    if (Math.abs(ax0) > 0.12) yaw = -ax0;
    if (Math.abs(ax1) > 0.12) pitch = -ax1;
    if (gp.buttons[7]?.pressed) boost = true;
    if (gp.buttons[5]?.pressed) throttle = 1;
    if (gp.buttons[4]?.pressed) vertical = 1;
    if (gp.buttons[3]?.pressed) vertical = -1;
    if (gp.buttons[0]?.pressed) primaryPulse = true;
    if (gp.buttons[2]?.pressed) throwPulse = true;
    if (gp.buttons[1]?.pressed) superPulse = true;
  }

  if (isTouchActive()) {
    const t = computeTouchFlight();
    yaw = t.yaw;
    pitch = t.pitch;
    vertical = t.vertical;
    throttle = t.throttle;
    boost = boost || t.boost;
    if (t.primary) primaryPulse = true;
    if (t.throw) throwPulse = true;
    if (t.super) superPulse = true;
  }

  const out: FlightInput = {
    pitch,
    yaw,
    roll: yaw * 0.35,
    throttle,
    vertical,
    boost,
    primary: primaryPulse,
    throw: throwPulse,
    super: superPulse,
    photo: photoPulse
  };
  primaryPulse = false;
  throwPulse = false;
  superPulse = false;
  photoPulse = false;
  return out;
}
