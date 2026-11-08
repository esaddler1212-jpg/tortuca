import { LANDMARKS } from './landmark-registry';
import type { GamePhase, SavedProgress } from './game-progress';
import { STARTER_VEHICLE_IDS, VEHICLE_CATALOG } from './vehicle-catalog';

export type GameUi = {
  showCarPicker(onPick: (vehicleId: string) => void): void;
  hideCarPicker(): void;
  setMission(text: string): void;
  setVehicleName(name: string): void;
  setProgressSummary(progress: SavedProgress): void;
  showToast(title: string, body: string): void;
  setGarageVisible(visible: boolean, progress: SavedProgress, onSelect: (id: string) => void): void;
  bindReset(onReset: () => void): void;
};

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

export function wireGameUi(): GameUi {
  const missionEl = el<HTMLParagraphElement>('mission');
  const vehicleEl = el<HTMLParagraphElement>('vehicle-name');
  const progressEl = el<HTMLParagraphElement>('progress');
  const pickerEl = el<HTMLDivElement>('car-picker');
  const garageEl = el<HTMLDivElement>('garage');
  const toastEl = el<HTMLDivElement>('toast');
  const resetBtn = el<HTMLButtonElement>('reset-progress');

  let toastTimer = 0;

  return {
    showCarPicker(onPick) {
      pickerEl.hidden = false;
      const grid = el<HTMLDivElement>('picker-grid');
      grid.innerHTML = '';
      for (const id of STARTER_VEHICLE_IDS) {
        const spec = VEHICLE_CATALOG[id];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'picker-card';
        btn.innerHTML = `<strong>${spec.name}</strong><span>${spec.tagline}</span>`;
        btn.addEventListener('click', () => onPick(id));
        grid.appendChild(btn);
      }
    },
    hideCarPicker() {
      pickerEl.hidden = true;
    },
    setMission(text: string) {
      missionEl.textContent = text;
    },
    setVehicleName(name: string) {
      vehicleEl.textContent = name;
    },
    setProgressSummary(progress) {
      const total = LANDMARKS.length;
      const done = progress.visitedLandmarkIds.length;
      const cars = progress.unlockedVehicleIds.length;
      progressEl.textContent = `Landmarks ${done}/${total} · Garage ${cars} cars`;
    },
    showToast(title: string, body: string) {
      toastEl.hidden = false;
      toastEl.innerHTML = `<strong>${title}</strong><p>${body}</p>`;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toastEl.hidden = true;
      }, 4200);
    },
    setGarageVisible(visible, progress, onSelect) {
      garageEl.hidden = !visible;
      if (!visible) return;
      const list = el<HTMLDivElement>('garage-list');
      list.innerHTML = '';
      for (const id of progress.unlockedVehicleIds) {
        const spec = VEHICLE_CATALOG[id];
        if (!spec) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = id === progress.activeVehicleId ? 'garage-card active' : 'garage-card';
        btn.textContent = spec.name;
        btn.addEventListener('click', () => onSelect(id));
        list.appendChild(btn);
      }
    },
    bindReset(onReset) {
      resetBtn.addEventListener('click', onReset);
    }
  };
}

export function missionTextForPhase(phase: GamePhase): string {
  if (phase === 'pick_car') return 'SFO rental — pick your ride';
  if (phase === 'to_safehouse') return 'Mission — drive to the Vallejo Safehouse (I-80 north)';
  return 'Free roam — visit blue beacons to unlock Bay Area cars';
}
