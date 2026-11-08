import { Entity, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import {
  loadProgress,
  reachSafehouse,
  resetProgress,
  setActiveVehicle,
  visitLandmark,
  chooseStarterCar,
  type SavedProgress
} from './game-progress';
import { missionTextForPhase, wireGameUi } from './game-ui';
import { LANDMARKS, SFO_AIRPORT_LOT, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { getVehicleSpec } from './vehicle-catalog';
import { createPlayerVehicle, destroyPlayerVehicle } from './vehicle-factory';

export type GameSession = {
  vehicle: Entity | null;
  progress: SavedProgress;
};

export function startGameSession(app: AppBase, speedEl: HTMLElement): GameSession {
  const ui = wireGameUi();
  let progress = loadProgress();
  let vehicle: Entity | null = null;
  let nearGarage = false;

  const onGarageSelect = (id: string) => {
    if (id === progress.activeVehicleId) return;
    swapVehicle(id);
    ui.showToast('Switched', getVehicleSpec(id).name);
    if (nearGarage) ui.setGarageVisible(true, progress, onGarageSelect);
  };

  const spawnAtAirport = () => {
    const y = hillOffsetM(SFO_AIRPORT_LOT.x, SFO_AIRPORT_LOT.z) + 0.8;
    return new Vec3(SFO_AIRPORT_LOT.x, y, SFO_AIRPORT_LOT.z);
  };

  const swapVehicle = (vehicleId: string, pos?: Vec3, yaw?: number) => {
    const old = vehicle?.getPosition();
    const oldRot = vehicle?.getEulerAngles();
    destroyPlayerVehicle(vehicle);
    const p = pos ?? old ?? spawnAtAirport();
    vehicle = createPlayerVehicle(app, vehicleId, p, yaw ?? oldRot?.y ?? SFO_AIRPORT_LOT.heading);
    progress = setActiveVehicle(progress, vehicleId);
    ui.setVehicleName(getVehicleSpec(vehicleId).name);
    ui.setProgressSummary(progress);
  };

  const beginAfterPick = (vehicleId: string) => {
    progress = chooseStarterCar(progress, vehicleId);
    ui.hideCarPicker();
    ui.setMission(missionTextForPhase(progress.phase));
    swapVehicle(vehicleId, spawnAtAirport(), SFO_AIRPORT_LOT.heading);
    ui.showToast('Keys in hand', 'Take US-101 / I-80 to the orange Safehouse in Vallejo.');
  };

  const resumeFromSave = () => {
    if (progress.phase === 'pick_car' || !progress.activeVehicleId) {
      ui.setMission(missionTextForPhase('pick_car'));
      ui.showCarPicker(beginAfterPick);
      return;
    }
    ui.setMission(missionTextForPhase(progress.phase));
    const atSafehouse = progress.safehouseReached;
    const pos = atSafehouse
      ? new Vec3(
          VALLEJO_SAFEHOUSE.x,
          hillOffsetM(VALLEJO_SAFEHOUSE.x, VALLEJO_SAFEHOUSE.z) + 0.8,
          VALLEJO_SAFEHOUSE.z + 18
        )
      : spawnAtAirport();
    swapVehicle(progress.activeVehicleId, pos);
    ui.setProgressSummary(progress);
  };

  ui.bindReset(() => {
    destroyPlayerVehicle(vehicle);
    vehicle = null;
    progress = resetProgress();
    ui.setGarageVisible(false, progress, () => {});
    ui.setMission(missionTextForPhase('pick_car'));
    ui.showCarPicker(beginAfterPick);
  });

  resumeFromSave();

  const camOffset = new Vec3(0, 3.2, 7.5);
  const lookAhead = 12;
  const camera = app.root.findByName('camera') as Entity | null;

  app.on('update', () => {
    if (!vehicle || !camera) return;

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

    if (progress.phase === 'to_safehouse') {
      const dx = pos.x - VALLEJO_SAFEHOUSE.x;
      const dz = pos.z - VALLEJO_SAFEHOUSE.z;
      if (Math.hypot(dx, dz) < VALLEJO_SAFEHOUSE.radius) {
        progress = reachSafehouse(progress);
        ui.setMission(missionTextForPhase('home'));
        ui.showToast('Safehouse secured', 'Landmark runs unlocked — swap rides here anytime.');
      }
    }

    if (progress.phase === 'home' || progress.safehouseReached) {
      const gdx = pos.x - VALLEJO_SAFEHOUSE.x;
      const gdz = pos.z - VALLEJO_SAFEHOUSE.z;
      const inGarage = Math.hypot(gdx, gdz) < VALLEJO_SAFEHOUSE.radius + 12;
      if (inGarage !== nearGarage) {
        nearGarage = inGarage;
        ui.setGarageVisible(inGarage, progress, onGarageSelect);
      }
    }

    if (progress.safehouseReached) {
      for (const lm of LANDMARKS) {
        if (progress.visitedLandmarkIds.includes(lm.id)) continue;
        const d = Math.hypot(pos.x - lm.x, pos.z - lm.z);
        if (d > lm.visitRadius) continue;
        progress = visitLandmark(progress, lm.id, lm.unlockVehicleId);
        const car = getVehicleSpec(lm.unlockVehicleId);
        ui.setProgressSummary(progress);
        ui.showToast(`${lm.name} cleared`, `Unlocked: ${car.name} (${car.city})`);
        if (nearGarage) ui.setGarageVisible(true, progress, onGarageSelect);
      }
    }
  });

  return { get vehicle() { return vehicle; }, progress };
}
