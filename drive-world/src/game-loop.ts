import { Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import {
  computeTouchControls,
  isTouchDriveActive,
  publishHud,
  registerSkipWaymo,
  registerToggleCamera
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
  saveLastPose,
  setCameraMode,
  type SavedProgress
} from './game-progress';
import { playLandmarkChime, playWaymoArrival, unlockAudio, updateEngineAudio } from './game-audio';
import { missionTextForPhase, wireGameUi } from './game-ui';
import { DISTRICT_LABELS, LANDMARKS, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { nextUnvisitedLandmark } from './landmark-navigation';
import { getVehicleSpec } from './vehicle-catalog';
import type { VehicleCustomization } from './vehicle-customization';
import { createPlayerVehicle, destroyPlayerVehicle } from './vehicle-factory';
import { buildWaymoRidePath, spawnWaymoRide, waymoPassengerCameraOffset, type WaymoRide } from './waymo-ride';
import type { CameraMode } from './game-progress';

export type GameSession = {
  vehicle: Entity | null;
  progress: SavedProgress;
};

export function startGameSession(app: AppBase, speedEl: HTMLElement): GameSession {
  const ui = wireGameUi();
  let progress = loadProgress();
  let vehicle: Entity | null = null;
  let waymo: WaymoRide | null = null;
  let nearGarage = false;
  let ridingWaymo = progress.phase === 'waymo_ride';
  let draftCustom: VehicleCustomization | null = null;
  let cameraMode: CameraMode = progress.cameraMode ?? 'chase';
  let poseSaveT = 0;
  let waterT = 0;

  window.addEventListener('drive-world:unlock-audio', () => unlockAudio(), { once: false });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') toggleCamera();
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
    const old = vehicle?.getPosition();
    const oldRot = vehicle?.getEulerAngles();
    destroyPlayerVehicle(vehicle);
    const p = pos ?? old ?? spawnFromProgress();
    const custom = getVehicleCustomization(progress, vehicleId);
    draftCustom = { ...custom };
    vehicle = createPlayerVehicle(app, vehicleId, p, yaw ?? oldRot?.y ?? progress.lastPose?.yaw ?? 15, custom);
    progress = setActiveVehicle(progress, vehicleId);
    ui.setVehicleName(getVehicleSpec(vehicleId).name);
    ui.setProgressSummary(progress);
    if (nearGarage) refreshGarageUi();
  }

  const applyCustomization = () => {
    if (!progress.activeVehicleId || !draftCustom) return;
    const pos = vehicle?.getPosition().clone();
    const yaw = vehicle?.getEulerAngles().y ?? 15;
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
      applyCustomization
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
    destroyPlayerVehicle(vehicle);
    vehicle = null;
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
    destroyPlayerVehicle(vehicle);
    vehicle = null;
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

    if (!vehicle) return;

    if (isTouchDriveActive()) {
      const { steering, throttle } = computeTouchControls();
      const vs = vehicle.script?.vehicle as { fire?: (e: string, s: number, t: number) => void } | undefined;
      vs?.fire?.('vehicle:controls', steering, throttle);
    }

    const pos = vehicle.getPosition();
    const forward = vehicle.forward;
    const right = vehicle.right;
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

    const vehScript = vehicle.script?.vehicle as { speed?: number } | undefined;
    const mph = Math.abs(vehScript?.speed ?? 0) * 0.621371;
    speedEl.textContent = `${mph.toFixed(0)} mph`;
    updateEngineAudio(mph, true);

    const yaw = vehicle.getEulerAngles().y;
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
      waterPhase: waterT
    });

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
    }
  });

  window.addEventListener('pointerdown', () => unlockAudio(), { once: true });

  return { get vehicle() { return vehicle; }, progress };
}
