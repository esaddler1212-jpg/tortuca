import { Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import {
  computeTouchControls,
  isTouchDriveActive,
  publishHud,
  registerFastTravel,
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
  registerWaymoReplay
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
  tryUnlockNightCoil,
  tryUnlockSkywayHover,
  saveLastPose,
  setCameraMode,
  collectItem,
  recordSpeedTrap,
  tickScenicRoute,
  completeScenicRoute,
  bumpVehicleStats,
  type SavedProgress
} from './game-progress';
import { bindDriveKeys, pollDriveInput } from './game-input';
import {
  playLandmarkChime,
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
import { missionTextForPhase, wireGameUi } from './game-ui';
import { DISTRICT_LABELS, LANDMARKS } from './landmark-registry';
import {
  claimCustomSafehouse,
  ensureSafehouseUnlocks,
  homeSpawn,
  nearUnlockedSafehouse,
  homeServicePoint,
  resolveHomeSafehouse,
  setHomeSafehouse
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

export function startGameSession(app: AppBase, speedEl: HTMLElement): GameSession {
  const ui = wireGameUi();
  let progress = loadProgress();
  let player: PlayerVehicle | null = null;
  const vehicle = () => player?.entity ?? null;
  let waymo: WaymoRide | null = null;
  let nearGarage = false;
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
    progress = setVehicleCustomization(progress, progress.activeVehicleId, draftCustom);
    swapVehicle(progress.activeVehicleId, pos, yaw);
    ui.showToast('Applied', 'Paint and tuning updated for this car.');
  };

  const refreshGarageUi = () => {
    if (!nearGarage || !progress.activeVehicleId) return;
    void ensureVehicleModelsLoaded(app, progress.unlockedVehicleIds);
    draftCustom = { ...getVehicleCustomization(progress, progress.activeVehicleId) };
    const svc = homeServicePoint(resolveHomeSafehouse(progress));
    ui.setGarageVisible(true, progress, onGarageSelect, svc.mode);
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
    ui.setMission(missionTextForPhase('home'));
    swapVehicle(vehicleId, safehouseSpawn(), 195);
    ui.showToast('You’re driving', 'Hit every beacon in a region to unlock that region’s car.');
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
    ui.setMission(missionTextForPhase('pick_car'));
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
    ui.setMission(missionTextForPhase('waymo_ride'));
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
      DISTRICT_LABELS[dist];
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

  registerFastTravel((district: DistrictId) => {
    if (!progress.unlockedRegionIds.includes(district) || !vehicle() || progress.phase !== 'home') return;
    const spot = FAST_TRAVEL.find((f) => f.district === district);
    if (!spot) return;
    const y = hillOffsetM(spot.x, spot.z) + 0.8;
    const ent = vehicle()!;
    ent.setPosition(spot.x, y, spot.z);
    ent.rigidbody?.applyImpulse(0, 0, 0);
    ui.showToast('Waymo drop', spot.label);
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
      ui.setMission(missionTextForPhase('pick_car'));
      ui.showCarPicker(beginAfterGaragePick);
      return;
    }
    ui.setMission(missionTextForPhase('home'));
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

    updateAmbientTraffic(dt, settings.showTraffic);

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
      updateEngineAudio(mph, true);
      player?.lights.setBrake(false);
    } else if (aerial) {
      const fs = ent.script?.flightVehicle as
        | { fire?: (e: string, ...args: number[]) => void }
        | undefined;
      fs?.fire?.('flight:controls', drive.steering, drive.throttle, drive.vertical);
      fs?.fire?.('flight:nitro', drive.nitro ? 1.65 : 1);
      player?.lights.setBrake(drive.throttle === 0 && drive.steering === 0 && drive.vertical === 0);
    } else {
      let steering = drive.steering;
      let throttle = drive.throttle;
      if (isTouchDriveActive()) {
        const t = computeTouchControls();
        steering = t.steering;
        throttle = t.throttle;
      }
      const vs = ent.script?.vehicle as { fire?: (e: string, ...args: number[]) => void } | undefined;
      if (steering !== 0 || throttle !== 0) {
        vs?.fire?.('vehicle:controls', steering, throttle);
      }
      vs?.fire?.('vehicle:nitro', drive.nitro ? 1.65 : 1);
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
      const vehScript = ent.script?.vehicle as { speed?: number; brakingVisual?: boolean } | undefined;
      const flightScript = ent.script?.flightVehicle as { speed?: number } | undefined;
      const speedKmh = aerial ? Math.abs(flightScript?.speed ?? 0) : Math.abs(vehScript?.speed ?? 0);
      mph = speedKmh * 0.621371;
      speedEl.textContent = aerial
        ? `${mph.toFixed(0)} mph · ${getVehicleSpec(progress.activeVehicleId!).locomotion === 'helicopter' ? 'Heli' : 'Hover'}`
        : `${mph.toFixed(0)} mph`;
      updateEngineAudio(mph, true);
    }

    progress = heatDecay(progress, mph, dt);
    progress = heatFromSpeedTrap(progress, mph, pos.x, pos.z);
    tickHeatSiren(progress.heatLevel ?? 0, dt);
    cloudSaveT += dt;
    if (cloudSaveT > 50 && progress.phase === 'home') {
      cloudSaveT = 0;
      void pushCloudProgress(progress);
    }

    const yaw = ent.getEulerAngles().y;
    const nextLm =
      progress.phase === 'home' ? nextUnvisitedLandmark(progress.visitedLandmarkIds, pos.x, pos.z) : null;

    if (progress.phase === 'home') {
      progress = ensureSafehouseUnlocks(progress);
      const near = nearUnlockedSafehouse(progress, pos.x, pos.z);
      const inGarage = near?.atHome === true;
      if (inGarage !== nearGarage) {
        nearGarage = inGarage;
        if (inGarage) {
          const svc = homeServicePoint(resolveHomeSafehouse(progress));
          ui.showToast(
            svc.mode === 'valet' ? 'Valet stand' : 'Garage door',
            svc.mode === 'valet'
              ? 'Pull up under the canopy for your fleet.'
              : 'Pull up to the lit door for your fleet.'
          );
          refreshGarageUi();
        } else ui.setGarageVisible(false, progress, onGarageSelect);
      }
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
      atSafehouse: Boolean(nearUnlockedSafehouse(progress, pos.x, pos.z)),
      homeSafehouseName: resolveHomeSafehouse(progress).name,
      homeServiceMode: homeServicePoint(resolveHomeSafehouse(progress)).mode,
      streetName: nearestStreetLabel(pos.x, pos.z)
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
          ui.showToast(`${DISTRICT_LABELS[u.district]} complete`, `Unlocked ${car.name}`);
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
