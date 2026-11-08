import {
  DISTRICT_LABELS,
  districtLandmarkTotal,
  districtLandmarksVisited,
  LANDMARKS
} from './landmark-registry';
import type { GamePhase, SavedProgress } from './game-progress';
import { GARAGE_STARTER_IDS, VEHICLE_CATALOG } from './vehicle-catalog';
import { TOTAL_LANDMARKS, countRegionsComplete, TOTAL_REGIONS } from './game-progress';
import type { DistrictId } from './world-config';

export type GameUi = {
  showCarPicker(onPick: (vehicleId: string) => void): void;
  hideCarPicker(): void;
  setMission(text: string): void;
  setVehicleName(name: string): void;
  setProgressSummary(progress: SavedProgress): void;
  setAutonomousMode(active: boolean): void;
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
  const hudEl = el<HTMLDivElement>('hud');

  let toastTimer = 0;

  return {
    showCarPicker(onPick) {
      pickerEl.hidden = false;
      const grid = el<HTMLDivElement>('picker-grid');
      grid.innerHTML = '';
      for (const id of GARAGE_STARTER_IDS) {
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
      const done = progress.visitedLandmarkIds.length;
      const regions = countRegionsComplete(progress);
      const regionLines = (Object.keys(DISTRICT_LABELS) as DistrictId[])
        .map((d) => {
          const v = districtLandmarksVisited(progress.visitedLandmarkIds, d);
          const t = districtLandmarkTotal(d);
          const mark = progress.unlockedRegionIds.includes(d) ? '✓' : '·';
          return `${mark} ${DISTRICT_LABELS[d]} ${v}/${t}`;
        })
        .join(' · ');
      progressEl.textContent = `Landmarks ${done}/${TOTAL_LANDMARKS} · Regions ${regions}/${TOTAL_REGIONS} — ${regionLines}`;
    },
    setAutonomousMode(active: boolean) {
      hudEl.classList.toggle('autonomous', active);
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
        btn.textContent = spec.region ? `${spec.name} (${spec.city})` : spec.name;
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
  if (phase === 'waymo_ride') return 'Waymo rider — autonomous run to Vallejo Safehouse';
  if (phase === 'pick_car') return 'Safehouse — pick up your car';
  return 'Clear every landmark in a region to unlock that region’s ride';
}
