import { Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import {
  navTurnHint,
  routeWaypointsForScenic,
  routeWaypointsToLandmark,
  routeWaypointsToPoint
} from './bay-navigation';
import { CITY_HUBS } from './city-map-registry';
import { ensureHubBuilt, updateHubStreaming } from './hub-streaming';
import { nearestStorefrontStrip } from './storefront-strips';
import { nearestTacoTruck } from './city-checkpoints';
import { nearestGasStation } from './gas-stations';
import { fuelMultiplier, fuelPercent, refillFuel, tickFuel } from './fuel-system';
import { nearestParkingSpot, scoreParking } from './landmark-parking';
import { recordParkingStars } from './parking-rewards';
import { shouldNotifySideshow, updateSideshowMeets } from './sideshow-meets';
import { appliedTuning } from './vehicle-customization';
import {
  computeTouchControls,
  isTouchDriveActive,
  publishHud,
  registerFastTravel,
  registerLandHere,
  getNavTarget,
  registerSkipWaymo,
  requestSkipWaymo,
  registerCycleAutopilotPreset,
  getHudSnapshot,
  registerSavePhotoCard,
  registerToggleAutopilot,
  registerToggleCamera,
  registerTogglePhoto,
  registerClaimSafehouse,
  registerSetHomeSafehouse,
  registerVistaCam,
  registerWaymoReplay,
  registerStartTaxi,
  registerDynoPull,
  registerBoardFlight
} from './game-bridge';
import {
  loadProgress,
  resetProgress,
  setActiveVehicle,
  visitLandmark,
  visitCruiseVista,
  chooseGarageCar,
  finishWaymoRide,
  getVehicleCustomization,
  setVehicleCustomization,
  tryUnlockCompletedRegions,
  findTacoTruck,
  saveProgress,
  tryUnlockNightCoil,
  tryUnlockSkywayHover,
  saveLastPose,
  recordTokyoFlight,
  unlockVehicle,
  visitTokyoLandmark,
  setCameraMode,
  collectItem,
  recordSpeedTrap,
  tickScenicRoute,
  completeScenicRoute,
  bumpVehicleStats,
  recordDynoRun,
  startTaxiContract,
  type SavedProgress
} from './game-progress';
import { bindDriveKeys, pollDriveInput } from './game-input';
import { isGamepadConnected, pollGamepadMenuActions } from './gamepad-hub';
import {
  hapticDragGo,
  hapticHeatChase,
  hapticMenu,
  hapticNitro,
  hapticParkingStar
} from './gamepad-haptics';
import { isSimulationPaused } from './console-graphics';
import {
  playLandmarkChime,
  playRaceTreeBeep,
  playVistaChime,
  playWaymoArrival,
  setMasterVolume,
  tickHeatSiren,
  unlockAudio,
  updateEngineAudio
} from './game-audio';
import {
  applyDriveCamera,
  applyGarageInteriorCamera,
  CAMERA_CYCLE,
  cameraModeLabel
} from './camera-profiles';
import { activeSprintLabel, freshSprintRuntime, tickLandmarkSprint } from './landmark-sprints';
import { chapterObjectivePin } from './mission-nav';
import { tryUnlockCraftVehicles } from './craft-vehicle-unlocks';
import { tryAwardDistrictMeetBadge, tryUnlockDistrictMeetVehicles } from './district-meets';
import { bumpHeatPeak, tryUnlockActivityVehicles } from './vehicle-activity-unlocks';
import { appendJournal } from './cruise-journal';
import { nearestCruiseVista, type CruiseVistaDef } from './cruise-vistas';
import { loadSettings, saveSettings } from './game-settings';
import { setMusicDistrict, unlockMusic } from './game-music';
import { saveCruisePhotoCard } from './photo-share';
import { coastalRainAdjust, districtAt, fogDistances, regionalFogStrength } from './regional-weather';
import { nearestStreetLabel } from './street-name-registry';
import { COLLECTIBLES, FAST_TRAVEL, SCENIC_ROUTES, SPEED_TRAPS } from './world-extras';
import { createPhotoCamera } from './photo-mode';
import { updateAmbientTraffic } from './build-world-extras';
import { DRAG_STRIPS, TIME_ATTACKS } from './cpm-challenges';
import {
  clearGhostRun,
  dragProgress01,
  ghostHudLabel,
  resetGhostRun,
  sampleGhostRun,
  storeGhostTapeIfPb
} from './cpm-ghost';
import { tickHeatChaser } from './heat-chaser';
import {
  applyCpmHit,
  flushDriftBest,
  dragTreeHudLabel,
  freshCpmRuntime,
  nearestDriftPad,
  tickDriftScore,
  tickDragStrip,
  tickTimeAttack
} from './cpm-scoring';
import { applyCameraFovBoost, pulseVehicleUnderglow } from './drive-feel';
import { freshTaxiRuntime, tickTaxiContract } from './cpm-taxi';
import { dynoSheet } from './vehicle-dyno';
import { bayRegionsGated, syncVallejoMissionSteps, VALLEJO_CHAPTER_STEPS } from './mission-chapters';
import { missionTextForPhase, wireGameUi } from './game-ui';
import { DISTRICT_LABELS, LANDMARKS } from './landmark-registry';
import {
  claimCustomSafehouse,
  ensureSafehouseUnlocks,
  homeSpawn,
  nearUnlockedSafehouse,
  homeServicePoint,
  resolveHomeSafehouse,
  setHomeSafehouse,
  type ResolvedSafehouse
} from './safehouse-registry';
import { nextUnvisitedLandmark } from './landmark-navigation';
import {
  createAutopilotCruisePreset,
  cycleAutopilotPreset,
  stepAutopilotCruise,
  type AutopilotCruise,
  type AutopilotPreset
} from './autopilot-cruise';
import {
  AUTOPILOT_VEHICLE_ID,
  BONUS_CULTURE_IDS,
  getVehicleSpec,
  isAerialVehicle,
  supportsAutopilot
} from './vehicle-catalog';
import type { VehicleCustomization } from './vehicle-customization';
import { pushCloudProgress } from './game-cloud-save';
import { flushSessionTelemetry, installSessionTelemetryFlush, markSessionBoot } from './session-telemetry';
import { updateHubStreetTraffic } from './hub-street-traffic';
import { heatDecay, heatFromSpeedTrap } from './game-heat';
import { createPlayerVehicle, destroyPlayerVehicle, type PlayerVehicle } from './vehicle-factory';
import { ensureVehicleModelLoaded, ensureVehicleModelsLoaded } from './vehicle-gltf';
import type { GameSettings } from './game-settings';
import type { DistrictId } from './world-config';
import {
  buildWaymoRidePath,
  spawnWaymoRide,
  waymoCinematicCamera,
  waymoPassengerCameraOffset,
  type WaymoRide
} from './waymo-ride';
import type { CameraMode } from './game-progress';
import {
  HANEDA_PAD,
  SFO_FLIGHT_GATE,
  TOKYO_LANDMARKS,
  buildSfoFlightGate,
  buildTokyo,
  isInTokyo,
  isTokyoBuilt,
  nextTokyoLandmark,
  setTokyoActive,
  tokyoUnlockStatus
} from './tokyo-map';
import { TOKYO_FF_GARAGE_LABEL, tokyoVehicleForLandmark } from './tokyo-ff-cars';
import { FLIGHT_LEG1_SEC, FLIGHT_TOTAL_SEC, TOKYO_FOG, createFlightPlane, flightPose, type FlightRun } from './tokyo-flight';
import { NIGHT_FOG } from './night-palette';

export type GameSession = {
  vehicle: Entity | null;
  progress: SavedProgress;
};

function scriptInstance(ent: Entity, name: string): unknown {
  return (ent.script as unknown as Record<string, unknown> | undefined)?.[name];
}

export function startGameSession(app: AppBase, speedEl: HTMLElement): GameSession {
  const ui = wireGameUi();
  let progress = loadProgress();
  let player: PlayerVehicle | null = null;
  const vehicle = () => player?.entity ?? null;
  let waymo: WaymoRide | null = null;
  let nearGarage = false;
  let serviceSafehouse: ResolvedSafehouse | null = null;
  let ridingWaymo = progress.phase === 'waymo_ride';
  let draftCustom: VehicleCustomization | null = null;
  let cameraMode: CameraMode = progress.cameraMode ?? 'chase';
  let poseSaveT = 0;
  let waterT = 0;
  let settings = loadSettings();
  setMasterVolume(settings.masterVolume);
  let photoMode = false;
  const photo = createPhotoCamera(new Vec3());
  let lastPos = new Vec3();
  let statsT = 0;
  let cloudSaveT = 0;
  let hubStreamT = 0;
  let parkingHoldT = 0;
  let fuelRefillT = 0;
  let playerBaseEngineForce = 5200;
  let exhaustGain = 1;
  let worldTime = 0;
  let cpmRuntime = freshCpmRuntime();
  let sprintRuntime = freshSprintRuntime();
  let taxiRuntime = freshTaxiRuntime();
  let meetHoldT = 0;
  let lastYawDeg = 0;
  let yawSampleReady = false;
  let nitroCharge = 1;
  let nitroBoosting = false;
  let wasNitroBoosting = false;
  let wasHeatHunted = false;
  const photoKeys = { fwd: false, back: false, left: false, right: false, up: false, down: false };
  const CALDECOTT = { x: 392, z: 265 };
  let autopilotActive = false;
  let autopilot: AutopilotCruise = createAutopilotCruisePreset('tour');
  let rbTypeBeforeAutopilot: string | null = null;
  let cameraBeforeAutopilot: CameraMode | null = null;
  let vistaLookTarget: CruiseVistaDef | null = null;
  let cameraBeforeVista: CameraMode | null = null;
  let waymoSightseeing: WaymoRide | null = null;
  let waymoRideElapsed = 0;
  let sightseeing = false;
  let lastDistrict: DistrictId | null = null;
  let telemetryT = 0;
  markSessionBoot();
  installSessionTelemetryFlush(() => settings.shareSessionStats !== false, () => ({
    preset: settings.bayQualityPreset ?? 'balanced',
    district: lastDistrict,
    phase: progress.phase
  }));

  const stopAutopilot = (restoreCamera = true) => {
    if (!autopilotActive) return;
    autopilotActive = false;
    const ent = vehicle();
    const rb = ent?.rigidbody;
    if (rb && rbTypeBeforeAutopilot) rb.type = rbTypeBeforeAutopilot as 'dynamic' | 'kinematic' | 'static';
    rbTypeBeforeAutopilot = null;
    if (restoreCamera && cameraBeforeAutopilot) {
      cameraMode = cameraBeforeAutopilot;
      progress = setCameraMode(progress, cameraMode);
    }
    cameraBeforeAutopilot = null;
    publishHud({ autopilotActive: false, cameraMode });
  };

  const toggleAutopilot = () => {
    if (progress.phase !== 'home' || photoMode || ridingWaymo) return;
  const id = progress.activeVehicleId;
  if (!supportsAutopilot(id) || (id && isAerialVehicle(id))) return;
    const ent = vehicle();
    if (!ent) return;
    if (!autopilotActive) {
      const preset = loadSettings().autopilotPreset ?? 'tour';
      autopilot = createAutopilotCruisePreset(preset);
      autopilotActive = true;
      cameraBeforeAutopilot = cameraMode;
      cameraMode = 'cockpit';
      progress = setCameraMode(progress, cameraMode);
      const rb = ent.rigidbody;
      if (rb) {
        rbTypeBeforeAutopilot = rb.type;
        rb.type = 'kinematic' as const;
      }
      ui.showToast('Night Cruise', `${preset} autopilot — Y preset · T manual`);
      publishHud({ autopilotActive: true, cameraMode });
    } else {
      stopAutopilot(true);
      ui.showToast('Manual drive', 'Wheel is yours');
    }
  };

  bindDriveKeys();
  window.addEventListener('drive-world:unlock-audio', () => unlockAudio(), { once: false });
  window.addEventListener('keydown', (e) => {
    if (autopilotActive && (e.key === 'c' || e.key === 'C' || e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd')) {
      stopAutopilot(true);
      ui.showToast('Manual drive', 'Autopilot disengaged');
    }
    if (e.key === 'c' || e.key === 'C') toggleCamera();
    if (e.key === 'p' || e.key === 'P') togglePhoto();
    if ((e.key === 'f' || e.key === 'F') && !e.repeat) boardFlight();
    if (e.key === 't' || e.key === 'T') {
      if (!e.repeat) toggleAutopilot();
    }
    if (e.key === 'y' || e.key === 'Y') {
      if (!e.repeat) cycleAutopilotPresetSetting();
    }
    if (e.key === 'v' || e.key === 'V') {
      if (!e.repeat) toggleVistaCam();
    }
    if (photoMode) {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') photoKeys.fwd = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') photoKeys.back = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') photoKeys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') photoKeys.right = true;
      if (e.key === 'q' || e.key === 'Q') photoKeys.down = true;
      if (e.key === 'e' || e.key === 'E') photoKeys.up = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') photoKeys.fwd = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') photoKeys.back = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') photoKeys.left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') photoKeys.right = false;
    if (e.key === 'q' || e.key === 'Q') photoKeys.down = false;
    if (e.key === 'e' || e.key === 'E') photoKeys.up = false;
  });

  const safehouseSpawn = () => {
    const s = homeSpawn(progress);
    return new Vec3(s.x, s.y, s.z);
  };

  const spawnFromProgress = (): Vec3 => {
    const pose = progress.lastPose;
    if (progress.phase === 'home' && pose) return new Vec3(pose.x, pose.y, pose.z);
    return safehouseSpawn();
  };

  async function swapVehicle(vehicleId: string, pos?: Vec3, yaw?: number) {
    stopAutopilot(false);
    const old = vehicle()?.getPosition();
    const oldRot = vehicle()?.getEulerAngles();
    destroyPlayerVehicle(player?.entity ?? null);
    player = null;
    const p = (pos ?? old ?? spawnFromProgress()).clone();
    if (isAerialVehicle(vehicleId)) {
      const floor = hillOffsetM(p.x, p.z) + 0.8;
      p.set(p.x, Math.max(p.y, floor + 38), p.z);
    }
    try {
      await ensureVehicleModelLoaded(app, vehicleId);
    } catch {
      /* block fallback */
    }
    const custom = getVehicleCustomization(progress, vehicleId);
    draftCustom = { ...custom };
    player = createPlayerVehicle(app, vehicleId, p, yaw ?? oldRot?.y ?? progress.lastPose?.yaw ?? 15, custom);
    const tune = appliedTuning(getVehicleSpec(vehicleId), custom);
    playerBaseEngineForce = tune.maxEngineForce;
    exhaustGain = tune.exhaustGain;
    progress = setActiveVehicle(progress, vehicleId);
    lastPos.copy(p);
    ui.setVehicleName(getVehicleSpec(vehicleId).name);
    ui.setProgressSummary(progress);
    if (nearGarage) refreshGarageUi();
  }

  const applyCustomization = () => {
    if (!progress.activeVehicleId || !draftCustom) return;
    const pos = vehicle()?.getPosition().clone();
    const yaw = vehicle()?.getEulerAngles().y ?? 15;
    const activeId = progress.activeVehicleId;
    progress = setVehicleCustomization(progress, activeId, draftCustom);
    const tune = appliedTuning(getVehicleSpec(activeId), draftCustom);
    playerBaseEngineForce = tune.maxEngineForce;
    exhaustGain = tune.exhaustGain;
    swapVehicle(activeId, pos, yaw);
    ui.showToast('Applied', 'Paint and tuning updated for this car.');
  };

  const applyBonusVehicleUnlocks = () => {
    const sources = [
      tryUnlockActivityVehicles(progress),
      tryUnlockDistrictMeetVehicles(progress),
      tryUnlockCraftVehicles(progress)
    ];
    let changed = false;
    for (const out of sources) {
      if (out.progress === progress && out.newlyUnlocked.length === 0) continue;
      progress = out.progress;
      changed = true;
      for (const id of out.newlyUnlocked) {
        ui.showToast('Vehicle unlocked', getVehicleSpec(id).name, 6200);
        playLandmarkChime();
        progress = appendJournal(progress, { kind: 'cpm', id, label: getVehicleSpec(id).name });
      }
    }
    if (!changed) return;
    ui.setProgressSummary(progress);
    if (nearGarage) refreshGarageUi();
  };

  const syncMissionProgress = () => {
    const prev = progress.missionStepsCompleted;
    progress = syncVallejoMissionSteps(progress);
    if (progress.missionStepsCompleted.length <= prev.length) return;
    const id = progress.missionStepsCompleted.find((s) => !prev.includes(s));
    const step = VALLEJO_CHAPTER_STEPS.find((s) => s.id === id);
    if (id === 'v-unlock') {
      ui.showToast('Bay unlocked', 'City search, fast travel, and the full map are open.');
    } else {
      ui.showToast('Objective', step?.label ?? 'Complete');
    }
    ui.setMission(missionTextForPhase(progress.phase, progress));
    ui.setProgressSummary(progress);
    saveProgress(progress);
    publishHud({ progress });
  };

  const doDynoPull = () => {
    if (!progress.activeVehicleId) return;
    if (!nearGarage && progress.phase === 'home') {
      ui.showToast('Dyno', 'Pull into garage service bay first');
      return;
    }
    const spec = getVehicleSpec(progress.activeVehicleId);
    const custom = getVehicleCustomization(progress, progress.activeVehicleId);
    const sheet = dynoSheet(spec, custom);
    progress = recordDynoRun(progress);
    const readout = document.getElementById('dyno-readout');
    if (readout) {
      readout.hidden = false;
      readout.textContent = `${sheet.crankHp} crank / ${sheet.wheelHp} WHP · ${sheet.torqueLbFt} lb-ft · 0–60 ${sheet.zeroToSixtySec.toFixed(1)}s · ${sheet.quarterMiHint}`;
    }
    ui.showToast('Dyno pull', `${sheet.wheelHp} WHP logged`);
    syncMissionProgress();
    saveProgress(progress);
    publishHud({ progress });
  };

  const refreshGarageUi = () => {
    if (!nearGarage || !progress.activeVehicleId) return;
    void ensureVehicleModelsLoaded(app, progress.unlockedVehicleIds);
    draftCustom = { ...getVehicleCustomization(progress, progress.activeVehicleId) };
    exhaustGain = appliedTuning(getVehicleSpec(progress.activeVehicleId), draftCustom).exhaustGain;
    const house = serviceSafehouse ?? resolveHomeSafehouse(progress);
    const svc = homeServicePoint(house);
    ui.setGarageVisible(true, progress, onGarageSelect, svc.mode, house.name);
    ui.bindCustomize(
      progress.activeVehicleId,
      draftCustom,
      (next) => {
        draftCustom = next;
      },
      applyCustomization,
      progress.unlockedPaintIds
    );
  };

  const onGarageSelect = (id: string) => {
    if (id === progress.activeVehicleId) return;
    swapVehicle(id);
    ui.showToast('Switched', getVehicleSpec(id).name);
    refreshGarageUi();
  };

  const beginAfterGaragePick = (vehicleId: string) => {
    progress = chooseGarageCar(progress, vehicleId);
    ui.hideCarPicker();
    ui.setAutonomousMode(false);
    ui.setMission(missionTextForPhase('home', progress));
    swapVehicle(vehicleId, safehouseSpawn(), 195);
    ui.showToast('Chapter 1', 'Find the Vallejo taco truck + any Vallejo landmark to open the Bay.');
    ui.setProgressSummary(progress);
    unlockAudio();
    void unlockMusic();
  };

  const endWaymoRide = () => {
    waymo?.destroy();
    waymo = null;
    ridingWaymo = false;
    waymoRideElapsed = 0;
    progress = finishWaymoRide(progress);
    ui.setAutonomousMode(false);
    ui.setMission(missionTextForPhase('pick_car', progress));
    ui.setVehicleName('');
    playWaymoArrival();
    ui.showToast('Arrived at Safehouse', 'Pick up your car — then tour the Bay for regional unlocks.');
    ui.showCarPicker(beginAfterGaragePick);
    publishHud({ ridingWaymo: false, phase: progress.phase, progress });
  };

  const startWaymoRide = () => {
    destroyPlayerVehicle(player?.entity ?? null);
    player = null;
    ridingWaymo = true;
    ui.setAutonomousMode(true);
    ui.setMission(missionTextForPhase('waymo_ride', progress));
    ui.setVehicleName('Waymo — autonomous');
    ui.setGarageVisible(false, progress, () => {});
    waymoRideElapsed = 0;
    const path = buildWaymoRidePath();
    waymo = spawnWaymoRide(app, path);
    publishHud({ ridingWaymo: true, phase: 'waymo_ride', progress });
  };

  const cycleAutopilotPresetSetting = () => {
    const s = loadSettings();
    const next = cycleAutopilotPreset(s.autopilotPreset ?? 'tour');
    saveSettings({ ...s, autopilotPreset: next });
    settings = loadSettings();
    if (autopilotActive) {
      autopilot = createAutopilotCruisePreset(next);
    }
    ui.showToast('Autopilot preset', next);
    publishHud({ autopilotPreset: next, settings });
  };

  const toggleVistaCam = () => {
    const ent = vehicle();
    if (!ent || progress.phase !== 'home') return;
    const pos = ent.getPosition();
    const near = nearestCruiseVista(pos.x, pos.z);
    if (!near) return;
    if (cameraMode === 'vista') {
      cameraMode = cameraBeforeVista ?? 'chase';
      vistaLookTarget = null;
      cameraBeforeVista = null;
    } else {
      cameraBeforeVista = cameraMode;
      cameraMode = 'vista';
      vistaLookTarget = near.vista;
    }
    progress = setCameraMode(progress, cameraMode);
    publishHud({ cameraMode });
  };

  const cycleCamera = (dir: 1 | -1) => {
    const idx = CAMERA_CYCLE.indexOf(cameraMode);
    const next = (idx + dir + CAMERA_CYCLE.length) % CAMERA_CYCLE.length;
    cameraMode = CAMERA_CYCLE[next] ?? 'chase';
    vistaLookTarget = null;
    progress = setCameraMode(progress, cameraMode);
    publishHud({ cameraMode });
    hapticMenu();
  };

  const toggleCamera = () => cycleCamera(1);

  registerSkipWaymo(() => {
    if (flight) finishFlight();
    else if (ridingWaymo) endWaymoRide();
    else if (sightseeing) endWaymoSightseeing();
  });

  registerToggleCamera(toggleCamera);

  const togglePhoto = () => {
    photoMode = photo.toggle();
    if (photoMode && vehicle()) {
      const p = vehicle()!.getPosition();
      photo.pos.set(p.x, p.y + 8, p.z);
    }
    publishHud({ photoMode });
    document.body.classList.toggle('photo-mode', photoMode);
  };

  registerTogglePhoto(togglePhoto);
  registerToggleAutopilot(toggleAutopilot);
  registerCycleAutopilotPreset(cycleAutopilotPresetSetting);
  registerVistaCam(toggleVistaCam);

  registerSavePhotoCard(() => {
    const ent = vehicle();
    if (!ent || !photoMode) return;
    const pos = ent.getPosition();
    const near = nearestCruiseVista(pos.x, pos.z);
    const dist = districtAt(pos.x, pos.z);
    const place =
      near?.vista.name ??
      nextUnvisitedLandmark(progress.visitedLandmarkIds, pos.x, pos.z)?.name ??
      (dist ? DISTRICT_LABELS[dist] : 'Bay Area');
    const vid = progress.activeVehicleId;
    void saveCruisePhotoCard({
      vehicleName: vid ? getVehicleSpec(vid).name : 'Cruiser',
      mph: getHudSnapshot().mph,
      placeLabel: place,
      subtitle: near?.vista.tagline
    });
  });

  const endWaymoSightseeing = () => {
    waymoSightseeing?.destroy();
    waymoSightseeing = null;
    sightseeing = false;
    const ent = vehicle();
    if (ent) ent.enabled = true;
    publishHud({ ridingWaymo: false });
  };

  const startWaymoSightseeing = () => {
    if (progress.phase !== 'home' || !nearGarage || sightseeing || ridingWaymo) return;
    const ent = vehicle();
    if (!ent) return;
    stopAutopilot(true);
    ent.enabled = false;
    sightseeing = true;
    const path = [...buildWaymoRidePath()].reverse();
    waymoSightseeing = spawnWaymoRide(app, path);
    ui.showToast('Waymo memory', 'Passenger replay from safehouse — scenic loop');
    publishHud({ ridingWaymo: true });
  };

  registerWaymoReplay(startWaymoSightseeing);

  registerSetHomeSafehouse((id) => {
    progress = setHomeSafehouse(progress, id);
    ui.setProgressSummary(progress);
    ui.showToast('Home safehouse', resolveHomeSafehouse(progress).name);
    publishHud({ progress });
  });

  registerClaimSafehouse((name) => {
    const ent = vehicle();
    if (!ent || progress.phase !== 'home') return;
    const mph = getHudSnapshot().mph;
    if (mph > 12) {
      ui.showToast('Park first', 'Slow below 12 mph to claim a custom safehouse.');
      return;
    }
    const p = ent.getPosition();
    progress = claimCustomSafehouse(progress, name, p.x, p.z);
    progress = ensureSafehouseUnlocks(progress);
    ui.setProgressSummary(progress);
    ui.showToast('Custom safehouse', resolveHomeSafehouse(progress).name);
    publishHud({ progress });
  });

  registerStartTaxi((contractId) => {
    if (progress.phase !== 'home') return;
    progress = startTaxiContract(progress, contractId);
    taxiRuntime = { activeId: contractId, pickedUp: false };
    saveProgress(progress);
    ui.showToast('Courier', 'Pickup beacon marked — roll slow to load');
    publishHud({ progress });
  });

  registerDynoPull(doDynoPull);
  ui.bindDynoPull(doDynoPull);

  registerFastTravel((district: DistrictId) => {
    if (inTokyo) {
      ui.showToast('Tokyo', 'Bay fast travel is back home — fly from the Haneda pad');
      return;
    }
    if (bayRegionsGated(progress) && district !== 'vallejo') {
      ui.showToast('Chapter 1', 'Vallejo taco + landmark unlocks Bay fast travel');
      return;
    }
    if (!progress.unlockedRegionIds.includes(district) || !vehicle() || progress.phase !== 'home') return;
    const spot = FAST_TRAVEL.find((f) => f.district === district);
    if (!spot) return;
    const y = hillOffsetM(spot.x, spot.z) + 0.8;
    const ent = vehicle()!;
    ent.setPosition(spot.x, y, spot.z);
    ent.rigidbody?.applyImpulse(0, 0, 0);
    ui.showToast('Waymo drop', spot.label);
  });

  registerLandHere((x, z, label) => {
    const ent = vehicle();
    if (!ent || progress.phase !== 'home') return;
    if (inTokyo || isInTokyo(x, z)) {
      ui.showToast('Tokyo', 'Map landing is Bay-only — fly between SFO and Haneda');
      return;
    }
    if (bayRegionsGated(progress)) {
      if (districtAt(x, z) !== 'vallejo') {
        ui.showToast('Chapter 1', 'Finish Vallejo taco + landmark before leaving North Bay');
        return;
      }
    }
    const mphNow = getHudSnapshot().mph;
    if (mphNow > 22) {
      ui.showToast('Slow down', 'Under ~22 mph to land here.');
      return;
    }
    if (settings.hubStreamingEnabled) {
      for (const hub of CITY_HUBS) {
        const d = Math.hypot(x - hub.centerX, z - hub.centerZ);
        if (d < hub.radiusM + 420) ensureHubBuilt(app, hub);
      }
    }
    ent.setPosition(x, hillOffsetM(x, z) + 0.8, z);
    ent.rigidbody?.applyImpulse(0, 0, 0);
    ui.showToast('Landed', label);
  });

  buildSfoFlightGate(app);
  let inTokyo = false;
  let flight: FlightRun | null = null;
  let flightGateHintShown = false;

  const applyTokyoAtmosphere = (on: boolean) => {
    inTokyo = on;
    if (on) {
      if (!isTokyoBuilt()) buildTokyo(app);
      setTokyoActive(true);
      app.scene.fog.color = TOKYO_FOG.clone();
      ui.setMission(`${TOKYO_FF_GARAGE_LABEL} — 8 landmarks · one FF tribute each · Haneda flies home`);
    } else {
      setTokyoActive(false);
      app.scene.fog.color = NIGHT_FOG.clone();
      ui.setMission(missionTextForPhase(progress.phase, progress));
    }
  };

  const flightGateStatus = (x: number, z: number) => {
    if (inTokyo) {
      return Math.hypot(x - HANEDA_PAD.x, z - HANEDA_PAD.z) < HANEDA_PAD.radius ? ('toBay' as const) : null;
    }
    return Math.hypot(x - SFO_FLIGHT_GATE.x, z - SFO_FLIGHT_GATE.z) < SFO_FLIGHT_GATE.radius ? ('toTokyo' as const) : null;
  };

  const flightEnterDestination = (run: FlightRun) => {
    if (run.arrived) return;
    run.arrived = true;
    applyTokyoAtmosphere(run.dir === 'toTokyo');
  };

  const finishFlight = () => {
    const run = flight;
    if (!run) return;
    flightEnterDestination(run);
    run.plane.destroy();
    flight = null;
    progress = recordTokyoFlight(progress);
    const to = run.to;
    const y = hillOffsetM(to.x, to.z) + 0.8;
    if (progress.activeVehicleId) void swapVehicle(progress.activeVehicleId, new Vec3(to.x, y, to.z), to.yaw);
    progress = saveLastPose(progress, { x: to.x, y, z: to.z, yaw: to.yaw });
    publishHud({ ridingWaymo: false, flightCinematic: null, inTokyo, progress });
    if (run.dir === 'toTokyo') {
      ui.showToast('Welcome to Tokyo', `${TOKYO_LANDMARKS.length} landmarks — unlock the Fast family fleet`);
    } else {
      ui.showToast('Back at SFO', 'Bay Area night shift resumes');
    }
  };

  const boardFlight = () => {
    if (flight || progress.phase !== 'home' || ridingWaymo || sightseeing || photoMode) return;
    const ent = vehicle();
    if (!ent || !progress.activeVehicleId) return;
    const pos = ent.getPosition();
    const dir = flightGateStatus(pos.x, pos.z);
    if (!dir) return;
    if (dir === 'toTokyo' && !tokyoUnlockStatus(progress).unlocked) {
      const st = tokyoUnlockStatus(progress);
      ui.showToast('Tokyo flight locked', `Unlock every car (${st.cars}/${st.carsTotal}) and region (${st.regions}/${st.regionsTotal})`);
      return;
    }
    if (getHudSnapshot().mph > 12) {
      ui.showToast('Slow down', 'Stop on the gate pad to board.');
      return;
    }
    stopAutopilot(true);
    ent.enabled = false;
    const from = dir === 'toTokyo' ? SFO_FLIGHT_GATE : HANEDA_PAD;
    const to = dir === 'toTokyo' ? HANEDA_PAD : SFO_FLIGHT_GATE;
    const plane = createFlightPlane(app);
    plane.setPosition(from.x, 3, from.z);
    flight = {
      dir,
      t: 0,
      plane,
      arrived: false,
      from: { x: from.x, z: from.z, yaw: from.yaw, departYaw: from.departYaw },
      to: { x: to.x, z: to.z, yaw: to.yaw, arriveYaw: to.arriveYaw }
    };
    playWaymoArrival();
    ui.showToast(dir === 'toTokyo' ? 'SFO → Haneda' : 'Haneda → SFO', 'Night flight — A / Skip to land now');
  };
  registerBoardFlight(boardFlight);

  const resumeFromSave = () => {
    progress = tryUnlockNightCoil(progress);
    if (progress.phase === 'home' && progress.lastPose && isInTokyo(progress.lastPose.x, progress.lastPose.z)) {
      applyTokyoAtmosphere(true);
    }
    progress = ensureSafehouseUnlocks(progress);
    cameraMode = progress.cameraMode ?? 'chase';
    if (progress.phase === 'waymo_ride') {
      startWaymoRide();
      return;
    }
    if (progress.phase === 'pick_car') {
      ui.setMission(missionTextForPhase('pick_car', progress));
      ui.showCarPicker(beginAfterGaragePick);
      return;
    }
    ui.setMission(missionTextForPhase('home', progress));
    ui.setProgressSummary(progress);
    if (progress.activeVehicleId) {
      const yaw = progress.lastPose?.yaw ?? 15;
      swapVehicle(progress.activeVehicleId, spawnFromProgress(), yaw);
    }
    publishHud({ progress, phase: progress.phase, cameraMode });
  };

  ui.bindReset(() => {
    waymo?.destroy();
    waymo = null;
    destroyPlayerVehicle(player?.entity ?? null);
    player = null;
    ridingWaymo = false;
    if (flight) {
      flight.plane.destroy();
      flight = null;
    }
    applyTokyoAtmosphere(false);
    progress = resetProgress();
    cameraMode = 'chase';
    ui.setGarageVisible(false, progress, () => {});
    startWaymoRide();
  });

  resumeFromSave();

  const externalDrive = { steering: 0, throttle: 0 };
  (window as unknown as { cityNightsExternalDrive?: typeof externalDrive }).cityNightsExternalDrive = externalDrive;

  const camera = app.root.findByName('camera') as Entity | null;
  const bay = app.root.findByName('sf-bay') as Entity | null;

  app.on('update', (dt: number) => {
    if (!camera) return;
    externalDrive.steering = 0;
    externalDrive.throttle = 0;

    const paused = isSimulationPaused() && progress.phase === 'home' && !ridingWaymo && !photoMode;
    const hudTab = (tab: string) => {
      window.dispatchEvent(new CustomEvent('drive-world:hud-tab', { detail: tab }));
      hapticMenu();
    };
    for (const action of pollGamepadMenuActions()) {
      if (action === 'start') hudTab('map');
      else if (action === 'view') hudTab('settings');
      else if (action === 'back') {
        if (photoMode) togglePhoto();
        else if (sightseeing) endWaymoSightseeing();
        else hudTab('missions');
      } else if (paused) continue;
      else if (action === 'confirm' && (ridingWaymo || sightseeing || flight)) requestSkipWaymo();
      else if (action === 'tokyo-flight') boardFlight();
      else if (action === 'camera-next') cycleCamera(1);
      else if (action === 'camera-prev') cycleCamera(-1);
      else if (action === 'photo') togglePhoto();
      else if (action === 'autopilot') toggleAutopilot();
    }

    const wantScale = paused ? 0 : photoMode ? 0.38 : 1;
    if (app.timeScale !== wantScale) app.timeScale = wantScale;
    (window as unknown as { cityNightsDriveLocked?: boolean }).cityNightsDriveLocked = paused || photoMode;

    if (paused) {
      publishHud({ gamepadConnected: isGamepadConnected(), simPaused: true });
      return;
    }

    waterT += dt;

    const bayMat = (bay?.render?.meshInstances?.[0]?.material ?? null) as StandardMaterial | null;
    if (bayMat) {
      bayMat.emissiveIntensity = 0.16 + Math.sin(waterT * 0.9) * 0.07;
      bayMat.update();
    }

    if (ridingWaymo && waymo) {
      const still = waymo.update(dt);
      waymoRideElapsed += dt;
      const pos = waymo.root.getPosition();
      const forward = waymo.root.forward;
      const shot = waymoCinematicCamera(pos, forward, waymoRideElapsed);
      camera.setPosition(shot.eye);
      camera.lookAt(shot.look);
      speedEl.textContent = `${waymo.currentMph.toFixed(0)} mph · Waymo`;
      const yaw = waymo.root.getEulerAngles().y;
      publishHud({
        playerX: pos.x,
        playerZ: pos.z,
        yaw,
        mph: waymo.currentMph,
        phase: progress.phase,
        ridingWaymo: true,
        progress,
        nextLandmark: null,
        cameraMode,
        waterPhase: waterT
      });
      updateEngineAudio(waymo.currentMph, false);
      hubStreamT += dt;
      if (hubStreamT > 0.35) {
        hubStreamT = 0;
        updateHubStreaming(app, pos.x, pos.z, settings.hubStreamingEnabled);
      }
      if (!still) endWaymoRide();
      return;
    }

    if (sightseeing && waymoSightseeing) {
      const still = waymoSightseeing.update(dt);
      const pos = waymoSightseeing.root.getPosition();
      const forward = waymoSightseeing.root.forward;
      const passenger = waymoPassengerCameraOffset();
      const target = new Vec3(
        pos.x - forward.x * passenger.offset.z + forward.x * 0.15,
        pos.y + passenger.offset.y,
        pos.z - forward.z * passenger.offset.z
      );
      camera.setPosition(target);
      const look = new Vec3(
        pos.x + forward.x * passenger.lookAhead,
        pos.y + 0.6,
        pos.z + forward.z * passenger.lookAhead
      );
      camera.lookAt(look);
      speedEl.textContent = `${waymoSightseeing.currentMph.toFixed(0)} mph · Waymo memory`;
      publishHud({
        playerX: pos.x,
        playerZ: pos.z,
        yaw: waymoSightseeing.root.getEulerAngles().y,
        mph: waymoSightseeing.currentMph,
        phase: progress.phase,
        ridingWaymo: true,
        progress,
        nextLandmark: null,
        cameraMode: 'cockpit',
        waterPhase: waterT,
        nearGarageReplay: nearGarage
      });
      updateEngineAudio(waymoSightseeing.currentMph, false);
      if (!still) endWaymoSightseeing();
      return;
    }

    if (flight) {
      const run = flight;
      run.t += dt;
      const shot = flightPose(run);
      if (run.t >= FLIGHT_LEG1_SEC) flightEnterDestination(run);
      run.plane.setPosition(shot.pos);
      run.plane.lookAt(shot.pos.x + shot.dir.x, shot.pos.y + shot.climb, shot.pos.z + shot.dir.z);
      camera.setPosition(shot.eye);
      camera.lookAt(shot.pos);
      speedEl.textContent = `${shot.mph.toFixed(0)} mph · ${run.dir === 'toTokyo' ? 'SFO → HND' : 'HND → SFO'}`;
      publishHud({
        playerX: shot.pos.x,
        playerZ: shot.pos.z,
        yaw: run.plane.getEulerAngles().y,
        mph: shot.mph,
        phase: progress.phase,
        ridingWaymo: true,
        progress,
        nextLandmark: null,
        cameraMode,
        waterPhase: waterT,
        inTokyo: run.arrived ? run.dir === 'toTokyo' : inTokyo,
        flightCinematic: {
          label: run.dir === 'toTokyo' ? 'Night flight to Tokyo · Haneda' : 'Red-eye home · SFO',
          fade: shot.fade
        }
      });
      updateEngineAudio(Math.min(90, shot.mph * 0.4), false);
      if (run.t >= FLIGHT_TOTAL_SEC) finishFlight();
      return;
    }

    const ent = vehicle();
    if (!ent) return;

    worldTime += dt;
    updateAmbientTraffic(dt, settings.showTraffic);
    updateHubStreetTraffic(dt, settings.showTraffic);
    const sideshowSite = updateSideshowMeets(dt, worldTime, settings.showSideshow);
    const posEarly = ent.getPosition();
    hubStreamT += dt;
    if (hubStreamT > 0.35) {
      hubStreamT = 0;
      updateHubStreaming(app, posEarly.x, posEarly.z, settings.hubStreamingEnabled);
    }

    const posTrack = ent.getPosition();
    const district = districtAt(posTrack.x, posTrack.z);
    if (district !== lastDistrict) {
      lastDistrict = district;
      setMusicDistrict(district);
    }
    const fogStrength = regionalFogStrength(district);
    const fog = fogDistances(fogStrength, settings.fogQuality);
    const rainFx =
      settings.coastalWeatherEnabled !== false
        ? coastalRainAdjust(district, fog)
        : { fogStart: fog.start, fogEnd: fog.end, exposure: 0.55 };
    app.scene.fogStart = rainFx.fogStart;
    app.scene.fogEnd = rainFx.fogEnd;
    const tunnelD = Math.hypot(posTrack.x - CALDECOTT.x, posTrack.z - CALDECOTT.z);
    if (tunnelD < 100) {
      const tunnelT = 1 - tunnelD / 100;
      app.scene.fogEnd = rainFx.fogEnd * (1 - tunnelT * 0.5);
      app.scene.exposure = rainFx.exposure - tunnelT * 0.24;
    } else {
      app.scene.exposure = rainFx.exposure;
    }

    const aerial = progress.activeVehicleId ? isAerialVehicle(progress.activeVehicleId) : false;
    const onAutopilot = autopilotActive && supportsAutopilot(progress.activeVehicleId) && !aerial;

    let mph = 0;
    const drive = pollDriveInput();
    if (onAutopilot) {
      mph = stepAutopilotCruise(autopilot, ent, dt);
      speedEl.textContent = `${mph.toFixed(0)} mph · Autopilot`;
      updateEngineAudio(mph, true, exhaustGain);
      player?.lights.setBrake(false);
    } else if (aerial) {
      const fs = scriptInstance(ent, 'flightVehicle') as
        | { fire?: (e: string, ...args: number[]) => void }
        | undefined;
      fs?.fire?.('flight:controls', drive.steering, drive.throttle, drive.vertical);
      const flightNitro = drive.nitro && nitroCharge > 0.04 ? 1.55 + nitroCharge * 0.35 : 1;
      fs?.fire?.('flight:nitro', flightNitro);
      player?.lights.setBrake(drive.throttle === 0 && drive.steering === 0 && drive.vertical === 0);
    } else {
      let steering = drive.steering;
      let throttle = drive.throttle;
      if (isTouchDriveActive()) {
        const t = computeTouchControls();
        steering = t.steering;
        throttle = t.throttle;
      }
      const vs = scriptInstance(ent, 'vehicle') as { fire?: (e: string, ...args: number[]) => void } | undefined;
      externalDrive.steering = steering;
      externalDrive.throttle = throttle;
      vs?.fire?.('vehicle:nitro', 1);
      player?.lights.setBrake(throttle === 0 && steering === 0);
    }

  if (photoMode) {
    photo.move(dt * (settings.photoSensitivity ?? 1), photoKeys);
    photo.applyTo(camera);
    publishHud({
      playerX: ent.getPosition().x,
      playerZ: ent.getPosition().z,
      yaw: ent.getEulerAngles().y,
      mph: 0,
      phase: progress.phase,
      ridingWaymo: false,
      progress,
      nextLandmark: null,
      cameraMode,
      waterPhase: waterT,
      photoMode: true,
      nearGarage,
      settings
    });
    return;
  }

    const pos = ent.getPosition();
    if (!onAutopilot) {
      const vehScriptEarly = scriptInstance(ent, 'vehicle') as { speed?: number } | undefined;
      const flightScriptEarly = scriptInstance(ent, 'flightVehicle') as { speed?: number } | undefined;
      const speedKmhEarly = aerial
        ? Math.abs(flightScriptEarly?.speed ?? 0)
        : Math.abs(vehScriptEarly?.speed ?? 0);
      mph = speedKmhEarly * 0.621371;
    }
    if (sideshowSite && shouldNotifySideshow(pos.x, pos.z, sideshowSite)) {
      ui.showToast('Sideshow meet', `${sideshowSite.name} — respect the lot`);
    }
    const vistaNear = nearestCruiseVista(pos.x, pos.z);
    const shGarage =
      progress.phase === 'home' ? nearUnlockedSafehouse(progress, pos.x, pos.z) : null;
    const estateGarage =
      shGarage?.atService === true && shGarage.house.id === 'vallejo-safehouse' && mph < 22;
    let activeCam = cameraMode;
    if (
      vistaNear &&
      mph < 4 &&
      !onAutopilot &&
      !aerial &&
      cameraMode !== 'vista' &&
      cameraMode !== 'cockpit' &&
      cameraMode !== 'drone'
    ) {
      activeCam = 'orbit';
    }
    const vistaLook =
      cameraMode === 'vista' && (vistaLookTarget ?? vistaNear?.vista)
        ? {
            x: (vistaLookTarget ?? vistaNear!.vista).lookAtX,
            y: hillOffsetM((vistaLookTarget ?? vistaNear!.vista).lookAtX, (vistaLookTarget ?? vistaNear!.vista).lookAtZ) + 12,
            z: (vistaLookTarget ?? vistaNear!.vista).lookAtZ
          }
        : null;
    if (estateGarage && !onAutopilot && !aerial) {
      applyGarageInteriorCamera(camera, ent, shGarage!.house.x, shGarage!.house.z, dt);
    } else {
      applyDriveCamera(camera, ent, activeCam, dt, vistaLook, app);
    }

    if (!onAutopilot) {
      const vehScript = scriptInstance(ent, 'vehicle') as { speed?: number; brakingVisual?: boolean } | undefined;
      const flightScript = scriptInstance(ent, 'flightVehicle') as { speed?: number } | undefined;
      const speedKmh = aerial ? Math.abs(flightScript?.speed ?? 0) : Math.abs(vehScript?.speed ?? 0);
      mph = speedKmh * 0.621371;
      speedEl.textContent = aerial
        ? `${mph.toFixed(0)} mph · ${getVehicleSpec(progress.activeVehicleId!).locomotion === 'helicopter' ? 'Heli' : 'Hover'}`
        : `${mph.toFixed(0)} mph`;
      updateEngineAudio(mph, true, exhaustGain * (nitroBoosting ? 1.14 : 1));
      if (!aerial) {
        const wantsNitro = drive.nitro && !onAutopilot;
        nitroBoosting = wantsNitro && nitroCharge > 0.035;
        const vs = scriptInstance(ent, 'vehicle') as { fire?: (e: string, ...args: number[]) => void } | undefined;
        const mul = nitroBoosting ? 1.52 + nitroCharge * 0.38 : 1;
        vs?.fire?.('vehicle:nitro', mul);
        if (nitroBoosting) nitroCharge = Math.max(0, nitroCharge - dt * 0.44);
        else nitroCharge = Math.min(1, nitroCharge + dt * (mph > 28 ? 0.2 : 0.11));
        if (nitroBoosting && !wasNitroBoosting) hapticNitro();
        wasNitroBoosting = nitroBoosting;
        pulseVehicleUnderglow(ent, nitroBoosting);
        applyCameraFovBoost(camera, nitroBoosting, dt);
      } else if (drive.nitro && nitroCharge > 0.04) {
        nitroBoosting = true;
        if (!wasNitroBoosting) hapticNitro();
        nitroCharge = Math.max(0, nitroCharge - dt * 0.35);
      } else {
        nitroBoosting = false;
        nitroCharge = Math.min(1, nitroCharge + dt * 0.14);
      }
      wasNitroBoosting = nitroBoosting;
    }

    progress = heatDecay(progress, mph, dt);
    progress = heatFromSpeedTrap(progress, mph, pos.x, pos.z);
    progress = bumpHeatPeak(progress, progress.heatLevel ?? 0);
    progress = tickFuel(progress, settings, mph, progress.activeVehicleId, dt);
    if (!aerial && progress.activeVehicleId) {
      const veh = scriptInstance(ent, 'vehicle') as { maxEngineForce?: number } | undefined;
      if (veh && typeof veh.maxEngineForce === 'number') {
        veh.maxEngineForce = playerBaseEngineForce * fuelMultiplier(progress, settings, progress.activeVehicleId);
      }
    }
    tickHeatSiren(progress.heatLevel ?? 0, dt);
    cloudSaveT += dt;
    if (cloudSaveT > 50 && progress.phase === 'home') {
      cloudSaveT = 0;
      void pushCloudProgress(progress);
    }
    telemetryT += dt;
    if (telemetryT > 120) {
      telemetryT = 0;
      flushSessionTelemetry(settings.shareSessionStats !== false, {
        preset: settings.bayQualityPreset ?? 'balanced',
        district,
        phase: progress.phase
      });
    }

    const yaw = ent.getEulerAngles().y;
    tickHeatChaser(
      app,
      progress.phase === 'home',
      progress.heatLevel ?? 0,
      pos.x,
      pos.z,
      pos.y,
      yaw,
      mph,
      dt
    );
    const tokyoNext =
      inTokyo && progress.phase === 'home' ? nextTokyoLandmark(progress.tokyoLandmarkIds, pos.x, pos.z) : null;
    const bayNextLm =
      progress.phase === 'home' && !inTokyo ? nextUnvisitedLandmark(progress.visitedLandmarkIds, pos.x, pos.z) : null;
    const nextLm =
      progress.phase !== 'home'
        ? null
        : inTokyo
          ? tokyoNext ?? { id: 'haneda', name: 'Haneda pad — fly home', x: HANEDA_PAD.x, z: HANEDA_PAD.z }
          : bayNextLm;
    const chapterPin = progress.phase === 'home' && !inTokyo ? chapterObjectivePin(progress) : null;

    const manualNav = getNavTarget();
    let navRoutePoints: { x: number; z: number }[] = [];
    let navTurnLabel = '';
    const navPin =
      manualNav ??
      (chapterPin
        ? { label: chapterPin.label, x: chapterPin.x, z: chapterPin.z }
        : nextLm
          ? { label: nextLm.name, x: nextLm.x, z: nextLm.z }
          : null);
    if (navPin && progress.phase === 'home' && inTokyo) {
      navRoutePoints = [
        { x: pos.x, z: pos.z },
        { x: navPin.x, z: navPin.z }
      ];
      navTurnLabel = navTurnHint(pos.x, pos.z, yaw, navRoutePoints);
    } else if (navPin && progress.phase === 'home') {
      if (manualNav?.scenicId) {
        const scenic = SCENIC_ROUTES.find((r) => r.id === manualNav.scenicId);
        navRoutePoints = scenic
          ? routeWaypointsForScenic(pos.x, pos.z, scenic)
          : routeWaypointsToPoint(pos.x, pos.z, navPin.x, navPin.z);
      } else if (manualNav || !nextLm) {
        navRoutePoints = routeWaypointsToPoint(pos.x, pos.z, navPin.x, navPin.z);
      } else {
        navRoutePoints = bayNextLm
          ? routeWaypointsToLandmark(pos.x, pos.z, bayNextLm)
          : routeWaypointsToPoint(pos.x, pos.z, navPin.x, navPin.z);
      }
      navTurnLabel = navTurnHint(pos.x, pos.z, yaw, navRoutePoints);
    }
    const strip = nearestStorefrontStrip(pos.x, pos.z);

    if (progress.phase === 'home') {
      progress = ensureSafehouseUnlocks(progress);
      const near = nearUnlockedSafehouse(progress, pos.x, pos.z);
      const inGarage = near?.atService === true;
      if (inGarage) serviceSafehouse = near.house;
      else if (!inGarage) serviceSafehouse = null;
      if (inGarage !== nearGarage) {
        nearGarage = inGarage;
        if (inGarage && near) {
          const svc = homeServicePoint(near.house);
          ui.showToast(
            svc.mode === 'valet' ? 'Valet stand' : 'Garage door',
            `${near.house.name} — full fleet & paints`
          );
          refreshGarageUi();
        } else ui.setGarageVisible(false, progress, onGarageSelect);
      }
    }

    const nearSh =
      progress.phase === 'home' ? nearUnlockedSafehouse(progress, pos.x, pos.z) : null;
    const serviceHouse = serviceSafehouse ?? (nearSh?.atService ? nearSh.house : null);

    let parkingSpot: ReturnType<typeof nearestParkingSpot> = null;
    let nearGas = false;
    if (progress.phase === 'home' && !aerial) {
      parkingSpot = nearestParkingSpot(pos.x, pos.z);
      const gasNear = nearestGasStation(pos.x, pos.z);
      nearGas = Boolean(gasNear);
      if (gasNear && mph < 5 && settings.fuelSimEnabled) {
        fuelRefillT += dt;
        if (fuelRefillT > 0.6) {
          const refill = refillFuel(progress);
          if (refill.fresh) {
            progress = refill.progress;
            saveProgress(progress);
            progress = appendJournal(progress, { kind: 'fuel', id: gasNear.id, label: gasNear.name });
            ui.showToast('Tank full', `${gasNear.name} — free fill`);
            if (nearGarage) refreshGarageUi();
          }
          fuelRefillT = 0;
        }
      } else fuelRefillT = 0;

      if (parkingSpot && mph < 5) {
        const stars = scoreParking(mph, pos.x, pos.z, yaw, parkingSpot);
        const best = progress.parkingStars[parkingSpot.id] ?? 0;
        if (stars > best) {
          parkingHoldT += dt;
          if (parkingHoldT > 0.85) {
            const outcome = recordParkingStars(progress, parkingSpot.id, stars as 1 | 2 | 3);
            progress = outcome.progress;
            progress = appendJournal(progress, { kind: 'parking', id: parkingSpot.id, label: parkingSpot.name });
            ui.showToast('Parked', `${parkingSpot.name} · ${stars}★`);
            hapticParkingStar(stars);
            for (const vid of outcome.newlyUnlockedVehicles) {
              ui.showToast('Parking reward', getVehicleSpec(vid).name);
            }
            if (nearGarage) refreshGarageUi();
            ui.setProgressSummary(progress);
            parkingHoldT = 0;
          }
        } else parkingHoldT = 0;
      } else parkingHoldT = 0;

      const padBefore = cpmRuntime.driftPadId;
      const driftScoreBefore = cpmRuntime.driftScore;
      if (!yawSampleReady) {
        lastYawDeg = yaw;
        yawSampleReady = true;
      }
      const yawDelta = ((yaw - lastYawDeg + 540) % 360) - 180;
      const yawRate = Math.abs(yawDelta) / Math.max(dt, 0.001);
      lastYawDeg = yaw;

      cpmRuntime = tickDriftScore(cpmRuntime, pos.x, pos.z, mph, yawRate, dt);
      if (padBefore && cpmRuntime.driftPadId !== padBefore) {
        const prevBest = progress.cpmDriftBests[padBefore] ?? 0;
        progress = flushDriftBest(progress, padBefore, driftScoreBefore);
        const nextBest = progress.cpmDriftBests[padBefore] ?? 0;
        if (nextBest > prevBest) {
          ui.showToast('Drift PB', `${padBefore} · ${nextBest}`, 6200);
          playVistaChime();
          progress = appendJournal(progress, { kind: 'cpm', id: padBefore, label: `Drift ${nextBest}` });
        }
      }

      const nowMs = performance.now();
      const dragOut = tickDragStrip(cpmRuntime, pos.x, pos.z, mph, nowMs);
      cpmRuntime = dragOut.rt;
      if (dragOut.hit?.kind === 'drag-countdown') {
        playRaceTreeBeep(false);
      }
      if (dragOut.hit?.kind === 'drag-go') {
        playRaceTreeBeep(true);
        resetGhostRun('drag', dragOut.hit.strip.id);
        ui.showToast('GO!', `${dragOut.hit.strip.name} — nail the finish beam`);
        hapticDragGo();
      }
      if (dragOut.hit?.kind === 'drag-finish') {
        const prevEt = progress.cpmDragBestET;
        const pb = prevEt == null || dragOut.hit.etSec < prevEt;
        progress = applyCpmHit(progress, dragOut.hit);
        progress = storeGhostTapeIfPb(progress, 'drag', dragOut.hit.strip.id, dragOut.hit.etSec * 1000, pb);
        clearGhostRun();
        if (pb) saveProgress(progress);
        ui.showToast(
          pb ? 'Personal best!' : 'Quarter mile',
          `${dragOut.hit.etSec.toFixed(2)}s · ${dragOut.hit.strip.name}`,
          pb ? 6800 : 4200
        );
        if (pb) playLandmarkChime();
        progress = appendJournal(progress, {
          kind: 'cpm',
          id: dragOut.hit.strip.id,
          label: `ET ${dragOut.hit.etSec.toFixed(2)}s`
        });
      }

      if (cpmRuntime.dragStripId && cpmRuntime.dragLaunchT != null) {
        const strip = DRAG_STRIPS.find((s) => s.id === cpmRuntime.dragStripId);
        if (strip) {
          const elapsed = nowMs - cpmRuntime.dragLaunchT;
          const prog = dragProgress01(pos.x, strip);
          sampleGhostRun(prog, elapsed);
        }
      }

      const timeOut = tickTimeAttack(cpmRuntime, pos.x, pos.z, nowMs);
      cpmRuntime = timeOut.rt;
      if (timeOut.hit?.kind === 'time-gate') {
        if (timeOut.hit.gateIndex === 0) resetGhostRun('time', timeOut.hit.attack.id);
        ui.showToast('Gate', `Split ${timeOut.hit.gateIndex + 1}`);
      }
      if (timeOut.hit?.kind === 'time-finish') {
        const prevMs = progress.cpmTimeAttackMs[timeOut.hit.attack.id];
        const pb = prevMs == null || timeOut.hit.ms < prevMs;
        progress = applyCpmHit(progress, timeOut.hit);
        progress = storeGhostTapeIfPb(progress, 'time', timeOut.hit.attack.id, timeOut.hit.ms, pb);
        clearGhostRun();
        if (pb) saveProgress(progress);
        const sec = (timeOut.hit.ms / 1000).toFixed(2);
        ui.showToast(
          pb ? 'Horizon split PB!' : 'Time attack',
          `${timeOut.hit.attack.name} · ${sec}s`,
          pb ? 6500 : 4200
        );
        if (pb) playLandmarkChime();
        progress = appendJournal(progress, {
          kind: 'cpm',
          id: timeOut.hit.attack.id,
          label: `${sec}s`
        });
      }

      const activeTa = cpmRuntime.timeAttackId
        ? TIME_ATTACKS.find((t) => t.id === cpmRuntime.timeAttackId)
        : null;
      if (activeTa && cpmRuntime.timeLapStartMs != null) {
        const elapsed = nowMs - cpmRuntime.timeLapStartMs;
        const prog = Math.min(0.99, cpmRuntime.timeGateIndex / activeTa.gates.length);
        sampleGhostRun(prog, elapsed);
      }

      if (progress.activeTaxiId && !taxiRuntime.activeId) {
        taxiRuntime = { activeId: progress.activeTaxiId, pickedUp: false };
      }
      const taxiOut = tickTaxiContract(taxiRuntime, progress, pos.x, pos.z, mph);
      taxiRuntime = taxiOut.rt;
      if (taxiOut.progress !== progress) {
        progress = taxiOut.progress;
        if (taxiOut.toast) ui.showToast(taxiOut.toast.title, taxiOut.toast.body);
        progress = appendJournal(progress, {
          kind: 'taxi',
          id: taxiOut.progress.taxiCompletedIds.at(-1) ?? 'courier',
          label: taxiOut.toast?.body ?? 'Courier'
        });
        saveProgress(progress);
      } else if (taxiOut.toast) {
        ui.showToast(taxiOut.toast.title, taxiOut.toast.body);
      }

      if (sideshowSite && mph < 12 && Math.hypot(pos.x - sideshowSite.x, pos.z - sideshowSite.z) < 48) {
        meetHoldT += dt;
        if (meetHoldT > 2.2) {
          const before = progress.meetBadges.length;
          progress = tryAwardDistrictMeetBadge(progress, sideshowSite, mph, meetHoldT);
          if (progress.meetBadges.length > before) {
            ui.showToast('Meet badge', sideshowSite.name);
            applyBonusVehicleUnlocks();
          }
          meetHoldT = 0;
        }
      } else meetHoldT = 0;

      const sprintOut = tickLandmarkSprint(sprintRuntime, progress, pos.x, pos.z, mph, performance.now());
      sprintRuntime = sprintOut.rt;
      if (sprintOut.progress !== progress) progress = sprintOut.progress;
      if (sprintOut.toast) {
        ui.showToast(sprintOut.toast.title, sprintOut.toast.body, 4800);
        if (sprintOut.toast.title.includes('PB')) playVistaChime();
      }

      syncMissionProgress();
      applyBonusVehicleUnlocks();
    }

    const driftPad = nearestDriftPad(pos.x, pos.z);
    const driftGoal = driftPad?.goalScore ?? 500;
    const taId = cpmRuntime.timeAttackId;
    const taDef = taId ? TIME_ATTACKS.find((t) => t.id === taId) : null;
    const frameMs = performance.now();
    const taElapsed =
      cpmRuntime.timeLapStartMs != null && taId ? frameMs - cpmRuntime.timeLapStartMs : null;
    const heatHunted = (progress.heatLevel ?? 0) >= 4.1;
    if (heatHunted && !wasHeatHunted) hapticHeatChase();
    wasHeatHunted = heatHunted;

    let ghostRivalLabel: string | null = null;
    if (cpmRuntime.dragStripId && cpmRuntime.dragLaunchT != null) {
      const strip = DRAG_STRIPS.find((s) => s.id === cpmRuntime.dragStripId);
      if (strip) {
        const elapsed = frameMs - cpmRuntime.dragLaunchT;
        ghostRivalLabel = ghostHudLabel(
          progress,
          'drag',
          strip.id,
          dragProgress01(pos.x, strip),
          elapsed
        );
      }
    } else if (taDef && taElapsed != null && taElapsed > 0) {
      const prog = Math.min(0.99, cpmRuntime.timeGateIndex / taDef.gates.length);
      ghostRivalLabel = ghostHudLabel(progress, 'time', taDef.id, prog, taElapsed);
    }
    publishHud({
      playerX: pos.x,
      playerZ: pos.z,
      yaw,
      mph,
      phase: progress.phase,
      ridingWaymo: false,
      progress,
      nextLandmark: nextLm,
      cameraMode,
      waterPhase: waterT,
      photoMode: false,
      nearGarage,
      nearGarageReplay: nearGarage,
      settings,
      flightMode: aerial,
      autopilotActive: onAutopilot,
      autopilotPreset: settings.autopilotPreset,
      atVista: Boolean(vistaNear && mph < 14),
      vistaName: vistaNear?.vista.name ?? null,
      vistaPulse: waterT,
      district: district ?? undefined,
      atSafehouse: Boolean(nearSh),
      homeSafehouseName: resolveHomeSafehouse(progress).name,
      serviceSafehouseName: serviceHouse?.name,
      homeServiceMode: serviceHouse
        ? homeServicePoint(serviceHouse).mode
        : homeServicePoint(resolveHomeSafehouse(progress)).mode,
      streetName: nearestStreetLabel(pos.x, pos.z),
      fuelPercent: settings.fuelSimEnabled ? fuelPercent(progress) : 100,
      nearGas,
      parkingSpotName:
        parkingSpot && mph < 8
          ? `${parkingSpot.name}${(progress.parkingStars[parkingSpot.id] ?? 0) > 0 ? ` · ${progress.parkingStars[parkingSpot.id]}★` : ''}`
          : undefined,
      activeSideshowName: sideshowSite?.name,
      navTarget: manualNav,
      navObjective: manualNav ? null : navPin ? { label: navPin.label, x: navPin.x, z: navPin.z } : null,
      navTurnLabel,
      navRoutePoints,
      storefrontStripLabel: strip ? `${strip.label} — ${strip.shops[0] ?? 'shops'}` : null,
      nitroPercent: Math.round(nitroCharge * 100),
      nitroBoosting,
      driftScore: progress.phase === 'home' ? cpmRuntime.driftScore : 0,
      driftGoal,
      driftPadName: driftPad?.name ?? null,
      dragTreeLabel: progress.phase === 'home' ? dragTreeHudLabel(cpmRuntime, frameMs) : null,
      timeAttackElapsedMs: taElapsed,
      timeAttackProgress: taDef
        ? `gate ${Math.min(cpmRuntime.timeGateIndex, taDef.gates.length)}/${taDef.gates.length}`
        : null,
      heatHunted,
      gamepadConnected: isGamepadConnected(),
      simPaused: false,
      ghostRivalLabel,
      pinnedChapterLabel: chapterPin?.label ?? null,
      pinnedChapterHint: chapterPin?.hint ?? null,
      landmarkSprintLabel: activeSprintLabel(sprintRuntime),
      garageInteriorCam: estateGarage,
      inTokyo,
      flightCinematic: null,
      flightPrompt: (() => {
        const gate = progress.phase === 'home' ? flightGateStatus(pos.x, pos.z) : null;
        if (!gate) return null;
        if (gate === 'toBay') return { label: 'Fly home to SFO', ready: true };
        const st = tokyoUnlockStatus(progress);
        return st.unlocked
          ? { label: 'Board flight to Tokyo', ready: true }
          : {
              label: 'Tokyo flight locked',
              ready: false,
              detail: `Cars ${st.cars}/${st.carsTotal} · Regions ${st.regions}/${st.regionsTotal}`
            };
      })()
    });

    statsT += dt;
    if (statsT > 1 && progress.activeVehicleId) {
      statsT = 0;
      const miles = Math.hypot(pos.x - lastPos.x, pos.z - lastPos.z) / 1609;
      progress = bumpVehicleStats(progress, progress.activeVehicleId, miles, mph);
      lastPos.copy(pos);
    }

    poseSaveT += dt;
    if (progress.phase === 'home' && poseSaveT > 2.5) {
      poseSaveT = 0;
      progress = saveLastPose(progress, { x: pos.x, y: pos.y, z: pos.z, yaw });
    }

    if (progress.phase === 'home' && inTokyo) {
      for (const lm of TOKYO_LANDMARKS) {
        if (progress.tokyoLandmarkIds.includes(lm.id)) continue;
        if (Math.hypot(pos.x - lm.x, pos.z - lm.z) > lm.visitRadius) continue;
        progress = visitTokyoLandmark(progress, lm.id);
        playLandmarkChime();
        const rideId = tokyoVehicleForLandmark(lm.id);
        if (rideId && !progress.unlockedVehicleIds.includes(rideId)) {
          progress = unlockVehicle(progress, rideId);
          const ride = getVehicleSpec(rideId);
          ui.showToast('Fast family unlock', `${ride.name} — ${ride.tagline}`);
        }
        ui.showToast(`Tokyo · ${lm.name}`, `${progress.tokyoLandmarkIds.length}/${TOKYO_LANDMARKS.length} — ${lm.blurb}`);
        ui.setProgressSummary(progress);
      }
    }

    if (progress.phase === 'home' && !inTokyo) {
      const atGate = flightGateStatus(pos.x, pos.z) === 'toTokyo';
      if (atGate && !flightGateHintShown) {
        flightGateHintShown = true;
        const st = tokyoUnlockStatus(progress);
        ui.showToast(
          st.unlocked ? 'Gate HND · Tokyo' : 'Gate HND · locked',
          st.unlocked
            ? 'Stop on the pad and board (F / D-pad ↑)'
            : `Bonus flight after every car (${st.cars}/${st.carsTotal}) + region (${st.regions}/${st.regionsTotal})`
        );
      } else if (!atGate) flightGateHintShown = false;
    }

    if (progress.phase === 'home' && !inTokyo) {
      for (const lm of LANDMARKS) {
        if (progress.visitedLandmarkIds.includes(lm.id)) continue;
        const d = Math.hypot(pos.x - lm.x, pos.z - lm.z);
        if (d > lm.visitRadius) continue;
        progress = visitLandmark(progress, lm.id);
        progress = appendJournal(progress, { kind: 'landmark', id: lm.id, label: lm.name });
        playLandmarkChime();
        ui.setProgressSummary(progress);
        ui.showToast('Landmark logged', lm.name);

        const unlocks = tryUnlockCompletedRegions(progress);
        progress = unlocks.progress;
        for (const u of unlocks.newlyUnlocked) {
          const car = getVehicleSpec(u.vehicleId);
          ui.showToast(`${DISTRICT_LABELS[u.district]} unlocked`, `${car.name} + regional safehouse`);
        }
        progress = ensureSafehouseUnlocks(progress);
        ui.setProgressSummary(progress);
        if (nearGarage) refreshGarageUi();
      }

      const tacoNear = nearestTacoTruck(pos.x, pos.z);
      if (tacoNear && mph < 22 && !progress.tacoTrucksFound.includes(tacoNear.district)) {
        progress = findTacoTruck(progress, tacoNear.district);
        progress = appendJournal(progress, { kind: 'taco', id: tacoNear.district, label: tacoNear.name });
        ui.showToast('Taco truck found', `${DISTRICT_LABELS[tacoNear.district]} — log any landmark to unlock the region`);
        ui.setProgressSummary(progress);
        const unlocks = tryUnlockCompletedRegions(progress);
        progress = unlocks.progress;
        for (const u of unlocks.newlyUnlocked) {
          const car = getVehicleSpec(u.vehicleId);
          ui.showToast(`${DISTRICT_LABELS[u.district]} unlocked`, `${car.name} + regional safehouse`);
        }
        progress = ensureSafehouseUnlocks(progress);
        ui.setProgressSummary(progress);
        if (nearGarage) refreshGarageUi();
      }

      if (vistaNear && mph < 18) {
        const v = vistaNear.vista;
        if (!progress.visitedVistaIds.includes(v.id)) {
          progress = visitCruiseVista(progress, v.id);
          progress = appendJournal(progress, { kind: 'vista', id: v.id, label: v.name });
          playVistaChime();
          ui.showToast('Vista logged', v.tagline);
          ui.setProgressSummary(progress);
        }
      }

      for (const c of COLLECTIBLES) {
        if (progress.collectedIds.includes(c.id)) continue;
        if (Math.hypot(pos.x - c.x, pos.z - c.z) > c.radius) continue;
        const markerY = hillOffsetM(c.x, c.z) + (c.yOffset ?? 1.2);
        if (c.requireAir && Math.abs(pos.y - markerY) > 30) continue;
        const hadHeli = progress.unlockedVehicleIds.includes('bonus-coast-heli');
        const hadGotham = progress.unlockedVehicleIds.includes('bonus-gotham-knight');
        const hadScarlet = progress.unlockedVehicleIds.includes('bonus-scarlet-five');
        const hadCoil = progress.unlockedVehicleIds.includes(AUTOPILOT_VEHICLE_ID);
        const hadCulture = new Set(BONUS_CULTURE_IDS.filter((id) => progress.unlockedVehicleIds.includes(id)));
        progress = collectItem(progress, c.id, c.unlockPaintId);
        ui.showToast('Collectible', c.name);
        if (!hadHeli && progress.unlockedVehicleIds.includes('bonus-coast-heli')) {
          ui.showToast('Aerial unlocked', getVehicleSpec('bonus-coast-heli').name);
        }
        if (!hadGotham && progress.unlockedVehicleIds.includes('bonus-gotham-knight')) {
          ui.showToast('Legend unlocked', getVehicleSpec('bonus-gotham-knight').name);
        }
        if (!hadScarlet && progress.unlockedVehicleIds.includes('bonus-scarlet-five')) {
          ui.showToast('Legend unlocked', getVehicleSpec('bonus-scarlet-five').name);
        }
        if (!hadCoil && progress.unlockedVehicleIds.includes(AUTOPILOT_VEHICLE_ID)) {
          ui.showToast('Autopilot unlocked', `${getVehicleSpec(AUTOPILOT_VEHICLE_ID).name} — press T at the wheel`);
        }
        for (const id of BONUS_CULTURE_IDS) {
          if (!hadCulture.has(id) && progress.unlockedVehicleIds.includes(id)) {
            ui.showToast('Bay homage unlocked', getVehicleSpec(id).name);
          }
        }
        if (nearGarage) refreshGarageUi();
      }

      for (const trap of SPEED_TRAPS) {
        if (Math.hypot(pos.x - trap.x, pos.z - trap.z) > trap.radius) continue;
        if (mph < 25) continue;
        const prev = progress.speedTrapBests[trap.id] ?? 0;
        if (mph > prev) {
          progress = recordSpeedTrap(progress, trap.id, Math.round(mph));
          ui.showToast(trap.name, `${Math.round(mph)} mph`);
          applyBonusVehicleUnlocks();
        }
      }

      for (const route of SCENIC_ROUTES) {
        if (progress.scenicCompleted.includes(route.id)) continue;
        const idx = progress.scenicProgress[route.id] ?? 0;
        const pt = route.points[idx];
        if (!pt) {
          const hadSky = progress.unlockedVehicleIds.includes('bonus-skyway-hover');
          progress = completeScenicRoute(progress, route.id);
          progress = appendJournal(progress, { kind: 'scenic', id: route.id, label: route.name });
          progress = tryUnlockSkywayHover(progress);
          ui.showToast('Scenic route', route.name);
          if (!hadSky && progress.unlockedVehicleIds.includes('bonus-skyway-hover')) {
            ui.showToast('Aerial unlocked', getVehicleSpec('bonus-skyway-hover').name);
          }
          continue;
        }
        if (Math.hypot(pos.x - pt.x, pos.z - pt.z) < route.checkpointRadius) {
          progress = tickScenicRoute(progress, route.id, idx);
          if ((progress.scenicProgress[route.id] ?? 0) >= route.points.length) {
            const hadSky = progress.unlockedVehicleIds.includes('bonus-skyway-hover');
            progress = completeScenicRoute(progress, route.id);
            progress = appendJournal(progress, { kind: 'scenic', id: route.id, label: route.name });
            progress = tryUnlockSkywayHover(progress);
            ui.showToast('Scenic complete', route.name);
            if (!hadSky && progress.unlockedVehicleIds.includes('bonus-skyway-hover')) {
              ui.showToast('Aerial unlocked', getVehicleSpec('bonus-skyway-hover').name);
            }
          }
        }
      }
    }
  });

  window.addEventListener('drive-world:settings', ((e: CustomEvent<GameSettings>) => {
    settings = e.detail;
    setMasterVolume(settings.masterVolume);
    publishHud({ settings });
  }) as EventListener);

  window.addEventListener('pointerdown', () => {
    unlockAudio();
    void unlockMusic();
  }, { once: true });

  return { get vehicle() { return player?.entity ?? null; }, progress };
}
