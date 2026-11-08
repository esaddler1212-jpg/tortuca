import { Entity, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import {
  loadProgress,
  resetProgress,
  setActiveVehicle,
  visitLandmark,
  chooseGarageCar,
  finishWaymoRide,
  tryUnlockCompletedRegions,
  type SavedProgress
} from './game-progress';
import { missionTextForPhase, wireGameUi } from './game-ui';
import { DISTRICT_LABELS, LANDMARKS, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { getVehicleSpec } from './vehicle-catalog';
import { createPlayerVehicle, destroyPlayerVehicle } from './vehicle-factory';
import { buildWaymoRidePath, spawnWaymoRide, waymoPassengerCameraOffset, type WaymoRide } from './waymo-ride';

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

  const safehouseSpawn = () =>
    new Vec3(
      VALLEJO_SAFEHOUSE.x,
      hillOffsetM(VALLEJO_SAFEHOUSE.x, VALLEJO_SAFEHOUSE.z) + 0.8,
      VALLEJO_SAFEHOUSE.z + 18
    );

  const onGarageSelect = (id: string) => {
    if (id === progress.activeVehicleId) return;
    swapVehicle(id);
    ui.showToast('Switched', getVehicleSpec(id).name);
    if (nearGarage) ui.setGarageVisible(true, progress, onGarageSelect);
  };

  const swapVehicle = (vehicleId: string, pos?: Vec3, yaw?: number) => {
    const old = vehicle?.getPosition();
    const oldRot = vehicle?.getEulerAngles();
    destroyPlayerVehicle(vehicle);
    const p = pos ?? old ?? safehouseSpawn();
    vehicle = createPlayerVehicle(app, vehicleId, p, yaw ?? oldRot?.y ?? 15);
    progress = setActiveVehicle(progress, vehicleId);
    ui.setVehicleName(getVehicleSpec(vehicleId).name);
    ui.setProgressSummary(progress);
  };

  const beginAfterGaragePick = (vehicleId: string) => {
    progress = chooseGarageCar(progress, vehicleId);
    ui.hideCarPicker();
    ui.setAutonomousMode(false);
    ui.setMission(missionTextForPhase('home'));
    swapVehicle(vehicleId, safehouseSpawn(), 195);
    ui.showToast('You’re driving', 'Hit every beacon in a region to unlock that region’s car.');
    ui.setProgressSummary(progress);
  };

  const endWaymoRide = () => {
    waymo?.destroy();
    waymo = null;
    ridingWaymo = false;
    progress = finishWaymoRide(progress);
    ui.setAutonomousMode(false);
    ui.setMission(missionTextForPhase('pick_car'));
    ui.setVehicleName('');
    ui.showToast('Arrived at Safehouse', 'Pick up your car — then tour the Bay for regional unlocks.');
    ui.showCarPicker(beginAfterGaragePick);
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
  };

  const resumeFromSave = () => {
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
      swapVehicle(progress.activeVehicleId, safehouseSpawn());
    }
  };

  ui.bindReset(() => {
    waymo?.destroy();
    waymo = null;
    destroyPlayerVehicle(vehicle);
    vehicle = null;
    ridingWaymo = false;
    progress = resetProgress();
    ui.setGarageVisible(false, progress, () => {});
    startWaymoRide();
  });

  resumeFromSave();

  const camOffset = new Vec3(0, 3.2, 7.5);
  const lookAhead = 12;
  const camera = app.root.findByName('camera') as Entity | null;

  app.on('update', (dt: number) => {
    if (!camera) return;

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
      if (!still) endWaymoRide();
      return;
    }

    if (!vehicle) return;

    const pos = vehicle.getPosition();
    const forward = vehicle.forward;
    const right = vehicle.right;
    const target = new Vec3(
      pos.x - forward.x * camOffset.z + right.x * camOffset.x,
      pos.y + camOffset.y,
      pos.z - forward.z * camOffset.z + right.z * camOffset.x
    );
    camera.setPosition(target);
    const look = new Vec3(pos.x + forward.x * lookAhead, pos.y + 0.8, pos.z + forward.z * lookAhead);
    camera.lookAt(look);

    const vehScript = vehicle.script?.vehicle as { speed?: number } | undefined;
    const mph = Math.abs(vehScript?.speed ?? 0) * 0.621371;
    speedEl.textContent = `${mph.toFixed(0)} mph`;

    if (progress.phase === 'home') {
      const gdx = pos.x - VALLEJO_SAFEHOUSE.x;
      const gdz = pos.z - VALLEJO_SAFEHOUSE.z;
      const inGarage = Math.hypot(gdx, gdz) < VALLEJO_SAFEHOUSE.radius + 12;
      if (inGarage !== nearGarage) {
        nearGarage = inGarage;
        ui.setGarageVisible(inGarage, progress, onGarageSelect);
      }

      for (const lm of LANDMARKS) {
        if (progress.visitedLandmarkIds.includes(lm.id)) continue;
        const d = Math.hypot(pos.x - lm.x, pos.z - lm.z);
        if (d > lm.visitRadius) continue;
        progress = visitLandmark(progress, lm.id);
        ui.setProgressSummary(progress);
        ui.showToast('Landmark logged', lm.name);

        const unlocks = tryUnlockCompletedRegions(progress);
        progress = unlocks.progress;
        for (const u of unlocks.newlyUnlocked) {
          const car = getVehicleSpec(u.vehicleId);
          ui.showToast(`${DISTRICT_LABELS[u.district]} complete`, `Unlocked ${car.name}`);
        }
        ui.setProgressSummary(progress);
        if (nearGarage) ui.setGarageVisible(true, progress, onGarageSelect);
      }
    }
  });

  return { get vehicle() { return vehicle; }, progress };
}
