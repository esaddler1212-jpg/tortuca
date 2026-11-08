import type { AutopilotPreset } from './autopilot-cruise';
import type { CameraMode, GamePhase, SavedProgress } from './game-progress';
import { loadSettings } from './game-settings';
import type { LandmarkDef } from './landmark-registry';
import type { GameSettings } from './game-settings';
import type { DistrictId } from './world-config';

export type { CameraMode };

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
  autopilotActive?: boolean;
  autopilotPreset?: AutopilotPreset;
  atVista?: boolean;
  vistaName?: string | null;
  vistaPulse?: number;
  nearGarageReplay?: boolean;
  district?: DistrictId;
  atSafehouse?: boolean;
  homeSafehouseName?: string;
  serviceSafehouseName?: string;
  homeServiceMode?: 'valet' | 'garage';
  streetName?: string | null;
  fuelPercent?: number;
  nearGas?: boolean;
  parkingSpotName?: string;
  activeSideshowName?: string;
};

export type TouchDrive = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  climb: boolean;
  descend: boolean;
  nitro: boolean;
};

type HudListener = (snap: HudSnapshot) => void;

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
  settings: loadSettings(),
  flightMode: false
};

const listeners = new Set<HudListener>();

let skipWaymoHandler: (() => void) | null = null;
let toggleCameraHandler: (() => void) | null = null;
let togglePhotoHandler: (() => void) | null = null;
let fastTravelHandler: ((d: DistrictId) => void) | null = null;
let toggleAutopilotHandler: (() => void) | null = null;
let cycleAutopilotPresetHandler: (() => void) | null = null;
let savePhotoCardHandler: (() => void) | null = null;
let waymoReplayHandler: (() => void) | null = null;
let vistaCamHandler: (() => void) | null = null;
let setHomeSafehouseHandler: ((id: string) => void) | null = null;
let claimSafehouseHandler: ((name: string) => void) | null = null;

let touchDrive: TouchDrive = {
  up: false,
  down: false,
  left: false,
  right: false,
  climb: false,
  descend: false,
  nitro: false
};

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

export function registerToggleAutopilot(fn: () => void): void {
  toggleAutopilotHandler = fn;
}

export function requestToggleAutopilot(): void {
  toggleAutopilotHandler?.();
}

export function registerCycleAutopilotPreset(fn: () => void): void {
  cycleAutopilotPresetHandler = fn;
}

export function requestCycleAutopilotPreset(): void {
  cycleAutopilotPresetHandler?.();
}

export function registerSavePhotoCard(fn: () => void): void {
  savePhotoCardHandler = fn;
}

export function requestSavePhotoCard(): void {
  savePhotoCardHandler?.();
}

export function registerWaymoReplay(fn: () => void): void {
  waymoReplayHandler = fn;
}

export function requestWaymoReplay(): void {
  waymoReplayHandler?.();
}

export function registerVistaCam(fn: () => void): void {
  vistaCamHandler = fn;
}

export function requestVistaCam(): void {
  vistaCamHandler?.();
}

export function registerSetHomeSafehouse(fn: (id: string) => void): void {
  setHomeSafehouseHandler = fn;
}

export function requestSetHomeSafehouse(id: string): void {
  setHomeSafehouseHandler?.(id);
}

export function registerClaimSafehouse(fn: (name: string) => void): void {
  claimSafehouseHandler = fn;
}

export function requestClaimSafehouse(name: string): void {
  claimSafehouseHandler?.(name);
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
  return (
    touchDrive.up ||
    touchDrive.down ||
    touchDrive.left ||
    touchDrive.right ||
    touchDrive.climb ||
    touchDrive.descend ||
    touchDrive.nitro
  );
}

export function computeTouchControls(): { steering: number; throttle: number; vertical: number } {
  const t = touchDrive;
  let steering = 0;
  let throttle = 0;
  let vertical = 0;
  if (t.left) steering += 1;
  if (t.right) steering -= 1;
  if (t.up) throttle += 1;
  if (t.down) throttle -= 1;
  if (t.climb) vertical += 1;
  if (t.descend) vertical -= 1;
  return { steering, throttle, vertical };
}
