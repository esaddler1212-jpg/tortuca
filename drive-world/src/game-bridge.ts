import type { GamePhase, SavedProgress } from './game-progress';
import type { LandmarkDef } from './landmark-registry';
import type { GameSettings } from './game-settings';
import type { DistrictId } from './world-config';

export type CameraMode = 'chase' | 'cockpit' | 'drone';

export type HudSnapshot = {
  playerX: number;
  playerZ: number;
  yaw: number;
  mph: number;
  phase: GamePhase;
  ridingWaymo: boolean;
  progress: SavedProgress | null;
  nextLandmark: LandmarkDef | null;
  cameraMode: CameraMode;
  waterPhase: number;
  photoMode: boolean;
  nearGarage: boolean;
  settings: GameSettings;
  flightMode?: boolean;
};

export type TouchDrive = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

type HudListener = (snap: HudSnapshot) => void;

const defaultSettings: GameSettings = {
  masterVolume: 0.85,
  fogQuality: 'med',
  showTraffic: true,
  photoSensitivity: 1
};

let snapshot: HudSnapshot = {
  playerX: 0,
  playerZ: 0,
  yaw: 0,
  mph: 0,
  phase: 'waymo_ride',
  ridingWaymo: false,
  progress: null,
  nextLandmark: null,
  cameraMode: 'chase',
  waterPhase: 0,
  photoMode: false,
  nearGarage: false,
  settings: defaultSettings,
  flightMode: false
};

const listeners = new Set<HudListener>();

let skipWaymoHandler: (() => void) | null = null;
let toggleCameraHandler: (() => void) | null = null;
let togglePhotoHandler: (() => void) | null = null;
let fastTravelHandler: ((d: DistrictId) => void) | null = null;

let touchDrive: TouchDrive = { up: false, down: false, left: false, right: false };

export function publishHud(patch: Partial<HudSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const fn of listeners) fn(snapshot);
}

export function subscribeHud(fn: HudListener): () => void {
  listeners.add(fn);
  fn(snapshot);
  return () => listeners.delete(fn);
}

export function getHudSnapshot(): HudSnapshot {
  return snapshot;
}

export function registerSkipWaymo(fn: () => void): void {
  skipWaymoHandler = fn;
}

export function registerToggleCamera(fn: () => void): void {
  toggleCameraHandler = fn;
}

export function registerTogglePhoto(fn: () => void): void {
  togglePhotoHandler = fn;
}

export function registerFastTravel(fn: (d: DistrictId) => void): void {
  fastTravelHandler = fn;
}

export function requestSkipWaymo(): void {
  skipWaymoHandler?.();
}

export function requestToggleCamera(): void {
  toggleCameraHandler?.();
}

export function requestTogglePhoto(): void {
  togglePhotoHandler?.();
}

export function requestFastTravel(district: DistrictId): void {
  fastTravelHandler?.(district);
}

export function setTouchDrive(partial: Partial<TouchDrive>): void {
  touchDrive = { ...touchDrive, ...partial };
}

export function getTouchDrive(): TouchDrive {
  return touchDrive;
}

export function isTouchDriveActive(): boolean {
  return touchDrive.up || touchDrive.down || touchDrive.left || touchDrive.right;
}

export function computeTouchControls(): { steering: number; throttle: number } {
  const t = touchDrive;
  let steering = 0;
  let throttle = 0;
  if (t.left) steering += 1;
  if (t.right) steering -= 1;
  if (t.up) throttle += 1;
  if (t.down) throttle -= 1;
  return { steering, throttle };
}
