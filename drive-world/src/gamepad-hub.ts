/**
 * Standard gamepad (Xbox layout in browsers): menu actions + connection detect.
 */

export type HudTabId = 'map' | 'missions' | 'garage' | 'settings';

export type GamepadMenuAction =
  | 'camera-next'
  | 'camera-prev'
  | 'photo'
  | 'autopilot'
  | 'confirm'
  | 'back'
  | 'start'
  | 'view'
  | 'tokyo-flight';

const BTN = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  BACK: 8,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15
} as const;

const menuPrev: boolean[] = [];
const bootPrev = new Map<number, boolean>();

function edge(gp: Gamepad, i: number): boolean {
  const now = !!gp.buttons[i]?.pressed;
  const was = menuPrev[i] ?? false;
  menuPrev[i] = now;
  return now && !was;
}

export function isGamepadConnected(): boolean {
  const list = navigator.getGamepads?.();
  if (!list) return false;
  for (const g of list) {
    if (g?.connected) return true;
  }
  return false;
}

/** Rising-edge menu actions for pad 0 (sticks/triggers stay in game-input). */
export function pollGamepadMenuActions(): GamepadMenuAction[] {
  const gp = navigator.getGamepads?.()[0];
  if (!gp?.connected) return [];
  const out: GamepadMenuAction[] = [];
  if (edge(gp, BTN.RB) || edge(gp, BTN.DPAD_RIGHT)) out.push('camera-next');
  if (edge(gp, BTN.LB) || edge(gp, BTN.DPAD_LEFT)) out.push('camera-prev');
  if (edge(gp, BTN.Y)) out.push('photo');
  if (edge(gp, BTN.X)) out.push('autopilot');
  if (edge(gp, BTN.A)) out.push('confirm');
  if (edge(gp, BTN.B)) out.push('back');
  if (edge(gp, BTN.START)) out.push('start');
  if (edge(gp, BTN.BACK)) out.push('view');
  if (edge(gp, BTN.DPAD_UP)) out.push('tokyo-flight');
  return out;
}

/** Poll A / Start on any connected pad (title overlay only). */
export function pollGamepadConfirmEdge(): boolean {
  const list = navigator.getGamepads?.();
  if (!list) return false;
  let hit = false;
  for (let pad = 0; pad < list.length; pad++) {
    const gp = list[pad];
    if (!gp?.connected) continue;
    for (const i of [BTN.A, BTN.START]) {
      const key = pad * 32 + i;
      const now = !!gp.buttons[i]?.pressed;
      const was = bootPrev.get(key) ?? false;
      bootPrev.set(key, now);
      if (now && !was) hit = true;
    }
  }
  return hit;
}

export const GAMEPAD_GLYPHS = {
  camera: 'LB / RB',
  photo: 'Y',
  nitro: 'A',
  autopilot: 'X',
  map: 'Menu',
  settings: 'View',
  resume: 'B',
  skip: 'A',
  flight: 'D-pad ↑',
  drive: 'L stick steer · RT gas · LT brake · A nitro'
} as const;
