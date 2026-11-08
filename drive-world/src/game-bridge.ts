import type { GamePhase, SavedProgress } from './game-progress';
import type { LandmarkDef } from './landmark-registry';

export type CameraMode = 'chase' | 'cockpit';

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
};

export type TouchDrive = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

type HudListener = (snap: HudSnapshot) => void;

const emptyProgress = (): SavedProgress => ({
  version: 4,
  phase: 'waymo_ride',
  activeVehicleId: null,
  unlockedVehicleIds: [],
  visitedLandmarkIds: [],
  unlockedRegionIds: [],
  safehouseReached: false,
  customizations: {},
  lastPose: null,
  cameraMode: 'chase'
} as SavedProgress);

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
  waterPhase: 0
};

const listeners = new Set<HudListener>();

let skipWaymoHandler: (() => void) | null = null;
let toggleCameraHandler: (() => void) | null = null;

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

export function requestSkipWaymo(): void {
  skipWaymoHandler?.();
}

export function requestToggleCamera(): void {
  toggleCameraHandler?.();
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

export function defaultHudProgress(): SavedProgress {
  return emptyProgress();
}
