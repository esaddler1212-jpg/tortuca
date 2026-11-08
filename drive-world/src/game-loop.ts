import { Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import {
  computeTouchControls,
  isTouchDriveActive,
  publishHud,
  registerFastTravel,
  registerSkipWaymo,
  registerToggleCamera,
  registerTogglePhoto
} from './game-bridge';
import {
  loadProgress,
  resetProgress,
  setActiveVehicle,
  visitLandmark,
  chooseGarageCar,
  finishWaymoRide,
  getVehicleCustomization,
  setVehicleCustomization,
  tryUnlockCompletedRegions,
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
import { playLandmarkChime, playWaymoArrival, setMasterVolume, unlockAudio, updateEngineAudio } from './game-audio';
import { loadSettings } from './game-settings';
import { districtAt, fogDistances, regionalFogStrength } from './regional-weather';
import { COLLECTIBLES, FAST_TRAVEL, SCENIC_ROUTES, SPEED_TRAPS } from './world-extras';
import { createPhotoCamera } from './photo-mode';
import { updateAmbientTraffic } from './build-world-extras';
import { missionTextForPhase, wireGameUi } from './game-ui';
import { DISTRICT_LABELS, LANDMARKS, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { nextUnvisitedLandmark } from './landmark-navigation';
import { getVehicleSpec, isAerialVehicle } from './vehicle-catalog';
import type { VehicleCustomization } from './vehicle-customization';
import { createPlayerVehicle, destroyPlayerVehicle, type PlayerVehicle } from './vehicle-factory';
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
  const photoKeys = { fwd: false, back: false, left: false, right: false, up: false, down: false };

  bindDriveKeys();
  window.addEventListener('drive-world:unlock-audio', () => unlockAudio(), { once: false });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') toggleCamera();
    if (e.key === 'p' || e.key === 'P') togglePhoto();
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

  const safehouseSpawn = () =>
    new Vec3(
      VALLEJO_SAFEHOUSE.x,
      hillOffsetM(VALLEJO_SAFEHOUSE.x, VALLEJO_SAFEHOUSE.z) + 0.8,
      VALLEJO_SAFEHOUSE.z + 18
    );

  const spawnFromProgress = (): Vec3 => {
    const pose = progress.lastPose;
    if (progress.phase === 'home' && pose) return new Vec3(pose.x, pose.y, pose.z);
    return safehouseSpawn();
  };

  function swapVehicle(vehicleId: string, pos?: Vec3, yaw?: number) {
    const old = vehicle()?.getPosition();
    const oldRot = vehicle()?.getEulerAngles();
    destroyPlayerVehicle(player?.entity ?? null);
    player = null;
    const p = pos ?? old ?? spawnFromProgress();
    if (isAerialVehicle(vehicleId)) {
      const floor = hillOffsetM(p.x, p.z) + 0.8;
      p.y = Math.max(p.y, floor + 38);
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
    draftCustom = { ...getVehicleCustomization(progress, progress.activeVehicleId) };
    ui.setGarageVisible(true, progress, onGarageSelect);
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

  const cameraCycle: CameraMode[] = ['chase', 'cockpit', 'drone'];

  const toggleCamera = () => {
    const idx = cameraCycle.indexOf(cameraMode);
    cameraMode = cameraCycle[(idx + 1) % cameraCycle.length];
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

  const chaseOffset = new Vec3(0, 3.2, 7.5);
  const cockpitOffset = new Vec3(0, 0.95, 0.15);
  const droneHeight = 24;
  const droneBack = 10;
  const lookAhead = 12;
  let droneCamPos = new Vec3();
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

    const ent = vehicle();
    if (!ent) return;

    updateAmbientTraffic(dt, settings.showTraffic);

    const district = districtAt(ent.getPosition().x, ent.getPosition().z);
    const fogStrength = regionalFogStrength(district);
    const fog = fogDistances(fogStrength, settings.fogQuality);
    app.scene.fogStart = fog.start;
    app.scene.fogEnd = fog.end;

    const drive = pollDriveInput();
    const aerial = progress.activeVehicleId ? isAerialVehicle(progress.activeVehicleId) : false;
    if (aerial) {
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
    const forward = ent.forward;
    const right = ent.right;
    if (cameraMode === 'drone') {
      const goal = new Vec3(
        pos.x - forward.x * droneBack,
        pos.y + droneHeight,
        pos.z - forward.z * droneBack
      );
      droneCamPos.lerp(goal, Math.min(1, dt * 4.5));
      camera.setPosition(droneCamPos);
      const look = new Vec3(pos.x + forward.x * 6, pos.y + 0.6, pos.z + forward.z * 6);
      camera.lookAt(look);
    } else {
      const offset = cameraMode === 'cockpit' ? cockpitOffset : chaseOffset;
      const camBack = cameraMode === 'cockpit' ? 0 : offset.z;
      const target = new Vec3(
        pos.x - forward.x * camBack + right.x * offset.x,
        pos.y + offset.y,
        pos.z - forward.z * camBack + right.z * offset.x
      );
      camera.setPosition(target);
      const lookDist = cameraMode === 'cockpit' ? 32 : lookAhead;
      const look = new Vec3(pos.x + forward.x * lookDist, pos.y + 0.75, pos.z + forward.z * lookDist);
      camera.lookAt(look);
      droneCamPos.copy(target);
    }

    const vehScript = ent.script?.vehicle as { speed?: number; brakingVisual?: boolean } | undefined;
    const flightScript = ent.script?.flightVehicle as { speed?: number } | undefined;
  const speedKmh = aerial ? Math.abs(flightScript?.speed ?? 0) : Math.abs(vehScript?.speed ?? 0);
  const mph = speedKmh * 0.621371;
    speedEl.textContent = aerial
      ? `${mph.toFixed(0)} mph · ${getVehicleSpec(progress.activeVehicleId!).locomotion === 'helicopter' ? 'Heli' : 'Hover'}`
      : `${mph.toFixed(0)} mph`;
    updateEngineAudio(mph, true);

    const yaw = ent.getEulerAngles().y;
    const nextLm =
      progress.phase === 'home' ? nextUnvisitedLandmark(progress.visitedLandmarkIds, pos.x, pos.z) : null;

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
      settings,
      flightMode: aerial
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
      const gdx = pos.x - VALLEJO_SAFEHOUSE.x;
      const gdz = pos.z - VALLEJO_SAFEHOUSE.z;
      const inGarage = Math.hypot(gdx, gdz) < VALLEJO_SAFEHOUSE.radius + 12;
      if (inGarage !== nearGarage) {
        nearGarage = inGarage;
        if (inGarage) refreshGarageUi();
        else ui.setGarageVisible(false, progress, onGarageSelect);
      }

      for (const lm of LANDMARKS) {
        if (progress.visitedLandmarkIds.includes(lm.id)) continue;
        const d = Math.hypot(pos.x - lm.x, pos.z - lm.z);
        if (d > lm.visitRadius) continue;
        progress = visitLandmark(progress, lm.id);
        playLandmarkChime();
        ui.setProgressSummary(progress);
        ui.showToast('Landmark logged', lm.name);

        const unlocks = tryUnlockCompletedRegions(progress);
        progress = unlocks.progress;
        for (const u of unlocks.newlyUnlocked) {
          const car = getVehicleSpec(u.vehicleId);
          ui.showToast(`${DISTRICT_LABELS[u.district]} complete`, `Unlocked ${car.name}`);
        }
        ui.setProgressSummary(progress);
        if (nearGarage) refreshGarageUi();
      }

      for (const c of COLLECTIBLES) {
        if (progress.collectedIds.includes(c.id)) continue;
        if (Math.hypot(pos.x - c.x, pos.z - c.z) > c.radius) continue;
        const markerY = hillOffsetM(c.x, c.z) + (c.yOffset ?? 1.2);
        if (c.requireAir && Math.abs(pos.y - markerY) > 30) continue;
        const hadHeli = progress.unlockedVehicleIds.includes('bonus-coast-heli');
        const hadGotham = progress.unlockedVehicleIds.includes('bonus-gotham-knight');
        const hadScarlet = progress.unlockedVehicleIds.includes('bonus-scarlet-five');
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

  window.addEventListener('pointerdown', () => unlockAudio(), { once: true });

  return { get vehicle() { return player?.entity ?? null; }, progress };
}
