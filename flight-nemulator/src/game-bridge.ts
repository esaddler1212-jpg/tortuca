import type { GameHudSnapshot } from './hud/HudApp';

type TouchFlight = {
  yaw: number;
  pitch: number;
  vertical: number;
  throttle: number;
  boost: boolean;
  primary: boolean;
  throw: boolean;
  super: boolean;
};

let snapshot: GameHudSnapshot = {
  heroName: 'Solar Apex',
  codename: 'Solar Apex',
  district: 'Sunstone Metro',
  speedKmh: 0,
  destructionUsd: 0,
  wantedStars: 0,
  wave: 0,
  stamina: 100,
  staminaMax: 100,
  superReady: true,
  quality: 'medium',
  flightMode: true,
  heroX: 0,
  heroZ: 0,
  dronesLeft: 0,
  lifetimeDestructionUsd: 0,
  dronesDestroyed: 0,
  loadingTip: '',
  manifestHints: [] as string[]
};

let touch: TouchFlight = {
  yaw: 0,
  pitch: 0,
  vertical: 0,
  throttle: 0.85,
  boost: false,
  primary: false,
  throw: false,
  super: false
};

let touchActive = false;

export function setHudSnapshot(s: GameHudSnapshot): void {
  snapshot = s;
}

export function getHudSnapshot(): GameHudSnapshot {
  return snapshot;
}

export function setTouchFlight(t: Partial<TouchFlight>, active: boolean): void {
  touch = { ...touch, ...t };
  touchActive = active;
}

export function isTouchActive(): boolean {
  return touchActive;
}

export function computeTouchFlight(): TouchFlight {
  return touch;
}
