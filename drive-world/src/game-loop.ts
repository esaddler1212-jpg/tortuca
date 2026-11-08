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
  registerDynoPull
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
import { applyDriveCamera, CAMERA_CYCLE, cameraModeLabel } from './camera-profiles';
import { appendJournal } from './cruise-journal';
import { nearestCruiseVista, type CruiseVistaDef } from './cruise-vistas';
import { loadSettings, saveSettings } from './game-settings';
import { setMusicDistrict, unlockMusic } from './game-music';
import { saveCruisePhotoCard } from './photo-share';
import { districtAt, fogDistances, regionalFogStrength } from './regional-weather';
import { nearestStreetLabel } from './street-name-registry';
import { COLLECTIBLES, FAST_TRAVEL, SCENIC_ROUTES, SPEED_TRAPS } from './world-extras';
import { createPhotoCamera } from './photo-mode';
import { updateAmbientTraffic } from './build-world-extras';
import { TIME_ATTACKS } from './cpm-challenges';
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
import { heatDecay, heatFromSpeedTrap } from './game-heat';
import { createPlayerVehicle, destroyPlayerVehicle, type PlayerVehicle } from './vehicle-factory';
import { ensureVehicleModelLoaded, ensureVehicleModelsLoaded } from './vehicle-gltf';
import type { GameSettings } from './game-settings';
import type { DistrictId } from './world-config';
import { buildWaymoRidePath, spawnWaymoRide, waymoPassengerCameraOffset, type WaymoRide } from './waymo-ride';
import type { CameraMode } from './game-progress';

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
  let taxiRuntime = freshTaxiRuntime();
  let meetHoldT = 0;
  let lastYawDeg = 0;
  let yawSampleReady = false;
  let nitroCharge = 1;
  let nitroBoosting = false;
  const photoKeys = { fwd: false, back: false, left: false, right: false, up: false, down: false };
  const CALDECOTT = { x: 392, z: 265 };
  let autopilotActive = false;
  let autopilot: AutopilotCruise = createAutopilotCruisePreset('tour');
  let rbTypeBeforeAutopilot: string | null = null;
  let cameraBeforeAutopilot: CameraMode | null = null;
  let vistaLookTarget: CruiseVistaDef | null = null;
  let cameraBeforeVista: CameraMode | null = null;
  let waymoSightseeing: WaymoRide | null = null;
  let sightseeing = false;
  let lastDistrict: DistrictId | null = null;

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

  const syncMissionProgress = () => {
    const prev = progress.missionStepsCompleted;
    progress = syncVallejoMissionSteps(progress);
    if (progress.missionStepsCompleted.length <= prev.length) return;
    const id = progress.missionStepsCompleted.find((s) => !prev.includes(s));
    const step = VALLEJO_CHAPTER_STEPS.find((s) => s.id === id);
    ui.showToast('Objective', step?.label ?? 'Complete');
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
    ui.showToast('Chapter 1', 'Vallejo training — finish the CPM board to unlock the Bay.');
    ui.setProgressSummary(progress);
    unlockAudio();
    void unlockMusic();
  };

  const endWaymoRide = () => {
    waymo?.destroy();
    waymo = null;
    ridingWaymo = false;
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

  const toggleCamera = () => {
    const idx = CAMERA_CYCLE.indexOf(cameraMode);
    cameraMode = CAMERA_CYCLE[(idx + 1) % CAMERA_CYCLE.length] ?? 'chase';
    vistaLookTarget = null;
    progress = setCameraMode(progress, cameraMode);
    publishHud({ cameraMode });
  };

  registerSkipWaymo(() => {
    if (!ridingWaymo) return;
    endWaymoRide();
  });

  registerToggleCamera(toggleCamera);

  const togglePhoto = () => {
    photoMode = photo.toggle();
    if (photoMode && vehicle()) {
      const p = vehicle()!.getPosition();
      photo.pos.set(p.x, p.y + 8, p.z);
    }
    app.timeScale = photoMode ? 0.38 : 1;
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
    if (bayRegionsGated(progress) && district !== 'vallejo') {
      ui.showToast('Chapter 1', 'Complete Vallejo objectives before Bay fast travel');
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

  const resumeFromSave = () => {
    progress = tryUnlockNightCoil(progress);
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
    progress = resetProgress();
    cameraMode = 'chase';
    ui.setGarageVisible(false, progress, () => {});
    startWaymoRide();
  });

  resumeFromSave();

  const camera = app.root.findByName('camera') as Entity | null;
  const bay = app.root.findByName('sf-bay') as Entity | null;

  app.on('update', (dt: number) => {
    if (!camera) return;
    waterT += dt;

    const bayMat = (bay?.render?.meshInstances?.[0]?.material ?? null) as StandardMaterial | null;
    if (bayMat) {
      bayMat.emissiveIntensity = 0.16 + Math.sin(waterT * 0.9) * 0.07;
      bayMat.update();
    }

    if (ridingWaymo && waymo) {
      const still = waymo.update(dt);
      const pos = waymo.root.getPosition();
      const forward = waymo.root.forward;
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

    const ent = vehicle();
    if (!ent) return;

    worldTime += dt;
    updateAmbientTraffic(dt, settings.showTraffic);
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
    app.scene.fogStart = fog.start;
    app.scene.fogEnd = fog.end;
    const tunnelD = Math.hypot(posTrack.x - CALDECOTT.x, posTrack.z - CALDECOTT.z);
    if (tunnelD < 100) {
      const tunnelT = 1 - tunnelD / 100;
      app.scene.fogEnd = fog.end * (1 - tunnelT * 0.5);
      app.scene.exposure = 0.55 - tunnelT * 0.24;
    } else {
      app.scene.exposure = 0.55;
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
      if (steering !== 0 || throttle !== 0) {
        vs?.fire?.('vehicle:controls', steering, throttle);
      }
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
    if (sideshowSite && shouldNotifySideshow(pos.x, pos.z, sideshowSite)) {
      ui.showToast('Sideshow meet', `${sideshowSite.name} — respect the lot`);
    }
    const vistaNear = nearestCruiseVista(pos.x, pos.z);
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
    applyDriveCamera(camera, ent, activeCam, dt, vistaLook);

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
        pulseVehicleUnderglow(ent, nitroBoosting);
        applyCameraFovBoost(camera, nitroBoosting, dt);
      } else if (drive.nitro && nitroCharge > 0.04) {
        nitroBoosting = true;
        nitroCharge = Math.max(0, nitroCharge - dt * 0.35);
      } else {
        nitroBoosting = false;
        nitroCharge = Math.min(1, nitroCharge + dt * 0.14);
      }
    }

    progress = heatDecay(progress, mph, dt);
    progress = heatFromSpeedTrap(progress, mph, pos.x, pos.z);
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

    const yaw = ent.getEulerAngles().y;
    const nextLm =
      progress.phase === 'home' ? nextUnvisitedLandmark(progress.visitedLandmarkIds, pos.x, pos.z) : null;

    const manualNav = getNavTarget();
    let navRoutePoints: { x: number; z: number }[] = [];
    let navTurnLabel = '';
    const navPin =
      manualNav ??
      (nextLm ? { label: nextLm.name, x: nextLm.x, z: nextLm.z } : null);
    if (navPin && progress.phase === 'home') {
      if (manualNav?.scenicId) {
        const scenic = SCENIC_ROUTES.find((r) => r.id === manualNav.scenicId);
        navRoutePoints = scenic
          ? routeWaypointsForScenic(pos.x, pos.z, scenic)
          : routeWaypointsToPoint(pos.x, pos.z, navPin.x, navPin.z);
      } else if (manualNav || !nextLm) {
        navRoutePoints = routeWaypointsToPoint(pos.x, pos.z, navPin.x, navPin.z);
      } else {
        navRoutePoints = routeWaypointsToLandmark(pos.x, pos.z, nextLm);
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
        ui.showToast('GO!', `${dragOut.hit.strip.name} — nail the finish beam`);
      }
      if (dragOut.hit?.kind === 'drag-finish') {
        const prevEt = progress.cpmDragBestET;
        const pb = prevEt == null || dragOut.hit.etSec < prevEt;
        progress = applyCpmHit(progress, dragOut.hit);
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

      const timeOut = tickTimeAttack(cpmRuntime, pos.x, pos.z, nowMs);
      cpmRuntime = timeOut.rt;
      if (timeOut.hit?.kind === 'time-gate') {
        ui.showToast('Gate', `Split ${timeOut.hit.gateIndex + 1}`);
      }
      if (timeOut.hit?.kind === 'time-finish') {
        const prevMs = progress.cpmTimeAttackMs[timeOut.hit.attack.id];
        const pb = prevMs == null || timeOut.hit.ms < prevMs;
        progress = applyCpmHit(progress, timeOut.hit);
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

      const nearMeet = Math.hypot(pos.x - 465, pos.z - 955) < 48;
      if (nearMeet && mph < 12) {
        meetHoldT += dt;
        if (meetHoldT > 2.2 && !progress.meetBadges.includes('vallejo-meet')) {
          progress = { ...progress, meetBadges: [...progress.meetBadges, 'vallejo-meet'] };
          ui.showToast('Meet badge', 'Vallejo yard — welcome to the lot');
          meetHoldT = 0;
        }
      } else meetHoldT = 0;

      syncMissionProgress();
    }

    const driftPad = nearestDriftPad(pos.x, pos.z);
    const driftGoal = driftPad?.goalScore ?? 500;
    const taId = cpmRuntime.timeAttackId;
    const taDef = taId ? TIME_ATTACKS.find((t) => t.id === taId) : null;
    const frameMs = performance.now();
    const taElapsed =
      cpmRuntime.timeLapStartMs != null && taId ? frameMs - cpmRuntime.timeLapStartMs : null;
    const heatHunted = (progress.heatLevel ?? 0) >= 4.1;
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
      heatHunted
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

    if (progress.phase === 'home') {
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
