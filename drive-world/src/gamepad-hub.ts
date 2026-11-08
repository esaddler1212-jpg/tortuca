/**
 * Standard gamepad (Xbox layout in browsers): menu actions + connection detect.
 */

export type HudTabId = 'map' | 'missions' | 'garage' | 'settings';

export type GamepadMenuAction =
  | 'camera-next'
  | 'camera-prev'
  | 'photo'
  | 'autopilot'
  | 'skip-waymo'
  | 'hud-tab'
  | 'confirm';

const BTN = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  BACK: 8,
  START: 9
} as const;

const prevPressed: boolean[] = [];

function edge(gp: Gamepad, i: number): boolean {
  const now = !!gp.buttons[i]?.pressed;
  const was = prevPressed[i] ?? false;
  prevPressed[i] = now;
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

let pendingTab: HudTabId | null = null;

export function consumeHudTabRequest(): HudTabId | null {
  const t = pendingTab;
  pendingTab = null;
  return t;
}

export function queueHudTab(tab: HudTabId): void {
  pendingTab = tab;
}

/** Rising-edge menu actions for pad 0 (excludes sticks/triggers — those stay in game-input). */
export function pollGamepadMenuActions(): { action: GamepadMenuAction; tab?: HudTabId }[] {
  const gp = navigator.getGamepads?.()[0];
  if (!gp?.connected) return [];
  const out: { action: GamepadMenuAction; tab?: HudTabId }[] = [];

  if (edge(gp, BTN.RB)) out.push({ action: 'camera-next' });
  if (edge(gp, BTN.LB)) out.push({ action: 'camera-prev' });
  if (edge(gp, BTN.Y)) out.push({ action: 'photo' });
  if (edge(gp, BTN.X)) out.push({ action: 'autopilot' });
  if (edge(gp, BTN.A)) out.push({ action: 'confirm' });
  if (edge(gp, BTN.START)) {
    pendingTab = 'map';
    out.push({ action: 'hud-tab', tab: 'map' });
  }
  if (edge(gp, BTN.BACK)) {
    pendingTab = 'settings';
    out.push({ action: 'hud-tab', tab: 'settings' });
  }

  return out;
}

/** Poll A on any connected pad (boot / Waymo skip). */
export function pollGamepadConfirmEdge(): boolean {
  const list = navigator.getGamepads?.();
  if (!list) return false;
  for (let pad = 0; pad < list.length; pad++) {
    const gp = list[pad];
    if (!gp?.connected) continue;
    for (const i of [BTN.A, BTN.START]) {
      const key = pad * 20 + i;
      const now = !!gp.buttons[i]?.pressed;
      const was = prevPressed[key] ?? false;
      prevPressed[key] = now;
      if (now && !was) return true;
    }
  }
  return false;
}

export const GAMEPAD_GLYPHS = {
  camera: 'LB / RB',
  photo: 'Y',
  nitro: 'RT',
  autopilot: 'X',
  map: 'Menu',
  settings: 'View',
  skip: 'A',
  drive: 'L stick · RT gas · LT brake'
} as const;
