import { DISTRICT_LABELS } from './landmark-registry';
import { missionBannerText } from './game-missions';
import { GARAGE_STARTER_IDS, VEHICLE_CATALOG } from './vehicle-catalog';
import { COLLECTIBLES } from './world-extras';
import { districtTacoFound } from './city-checkpoints';
import {
  TOTAL_LANDMARKS,
  countRegionsComplete,
  TOTAL_REGIONS,
  type GamePhase,
  type SavedProgress
} from './game-progress';
import type { HomeServiceMode } from './safehouse-registry';
import type { DistrictId } from './world-config';
import { PAINT_PRESETS, type VehicleCustomization } from './vehicle-customization';

export type GameUi = {
  showCarPicker(onPick: (vehicleId: string) => void): void;
  hideCarPicker(): void;
  setMission(text: string): void;
  setVehicleName(name: string): void;
  setProgressSummary(progress: SavedProgress): void;
  setAutonomousMode(active: boolean): void;
  showToast(title: string, body: string, durationMs?: number): void;
  setGarageVisible(
    visible: boolean,
    progress: SavedProgress,
    onSelect: (id: string) => void,
    serviceMode?: HomeServiceMode,
    siteName?: string
  ): void;
  bindCustomize(
    vehicleId: string | null,
    custom: VehicleCustomization,
    onChange: (next: VehicleCustomization) => void,
    onApply: () => void,
    unlockedPaintIds?: string[]
  ): void;
  bindReset(onReset: () => void): void;
  bindDynoPull(onPull: () => void): void;
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
      const districts = Object.keys(DISTRICT_LABELS) as DistrictId[];
      const tacos = districts.filter((d) => districtTacoFound(progress, d)).length;
      progressEl.textContent = `Landmarks ${done}/${TOTAL_LANDMARKS} · Regions ${regions}/${TOTAL_REGIONS} · Taco trucks ${tacos}/${districts.length}`;
    },
    setAutonomousMode(active: boolean) {
      hudEl.classList.toggle('autonomous', active);
    },
    showToast(title: string, body: string, durationMs = 4200) {
      toastEl.hidden = false;
      toastEl.classList.toggle('toast-celebrate', durationMs > 5000);
      toastEl.innerHTML = `<strong>${title}</strong><p>${body}</p>`;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toastEl.hidden = true;
        toastEl.classList.remove('toast-celebrate');
      }, durationMs);
    },
    setGarageVisible(visible, progress, onSelect, serviceMode = 'garage', siteName) {
      garageEl.hidden = !visible;
      const title = document.getElementById('garage-title');
      if (title) {
        const base = serviceMode === 'valet' ? 'Valet — full inventory' : 'Garage — full inventory';
        title.textContent = siteName ? `${base} · ${siteName}` : base;
      }
      const inv = document.getElementById('garage-inventory');
      if (inv) {
        inv.textContent = `${progress.unlockedVehicleIds.length} vehicles · ${progress.unlockedPaintIds.length} paints · ${progress.collectedIds.length}/${COLLECTIBLES.length} collectibles`;
      }
      if (!visible) return;
      const list = el<HTMLDivElement>('garage-list');
      list.innerHTML = '';
      for (const id of progress.unlockedVehicleIds) {
        const spec = VEHICLE_CATALOG[id];
        if (!spec) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = id === progress.activeVehicleId ? 'garage-card active' : 'garage-card';
        const prefix = spec.aerialBonus || spec.legendBonus || spec.cultureBonus ? '✦ ' : '';
        btn.textContent = spec.region ? `${prefix}${spec.name} (${spec.city})` : `${prefix}${spec.name}`;
        btn.addEventListener('click', () => onSelect(id));
        list.appendChild(btn);
      }
    },
    bindCustomize(vehicleId, custom, onChange, onApply, unlockedPaintIds) {
      const section = el<HTMLDivElement>('customize');
      if (!vehicleId) {
        section.hidden = true;
        return;
      }
      section.hidden = false;
      let selectedPaint = custom.paintPreset;
      const glow = el<HTMLInputElement>('slider-glow');
      const power = el<HTMLInputElement>('slider-power');
      const grip = el<HTMLInputElement>('slider-grip');
      const wheel = el<HTMLInputElement>('slider-wheel');
      const ride = el<HTMLInputElement>('slider-ride');
      const underglow = el<HTMLInputElement>('slider-underglow');
      const tint = el<HTMLInputElement>('slider-tint');
      const rims = el<HTMLInputElement>('slider-rims');
      const camber = el<HTMLInputElement>('slider-camber');
      const spoiler = el<HTMLInputElement>('slider-spoiler');
      const livery = el<HTMLInputElement>('slider-livery');
      const exhaust = el<HTMLSelectElement>('exhaust-note');
      const handling = el<HTMLSelectElement>('handling-preset');

      const emit = () => {
        onChange({
          paintPreset: selectedPaint,
          glow: Number(glow.value) / 100,
          power: Number(power.value) / 100,
          grip: Number(grip.value) / 100,
          wheel: Number(wheel.value) / 100,
          rideHeight: Number(ride.value) / 100,
          underglow: Number(underglow.value) / 100,
          tint: Number(tint.value) / 100,
          rims: Number(rims.value) / 100,
          camber: Number(camber.value) / 100,
          spoiler: Number(spoiler.value) / 100,
          liveryStripe: Number(livery.value) / 100,
          exhaustNote: (exhaust.value as VehicleCustomization['exhaustNote']) || 'stock',
          handling: (handling.value as VehicleCustomization['handling']) || 'grip'
        });
      };

      const allowed = new Set(unlockedPaintIds ?? PAINT_PRESETS.map((p) => p.id));
      const swatches = el<HTMLDivElement>('paint-swatches');
      swatches.innerHTML = '';
      for (const preset of PAINT_PRESETS.filter((p) => allowed.has(p.id))) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = preset.id === selectedPaint ? 'swatch active' : 'swatch';
        b.title = preset.label;
        b.style.setProperty(
          '--swatch',
          `rgb(${Math.round(preset.emissive[0] * 255)}, ${Math.round(preset.emissive[1] * 255)}, ${Math.round(preset.emissive[2] * 255)})`
        );
        b.addEventListener('click', () => {
          selectedPaint = preset.id;
          swatches.querySelectorAll('.swatch').forEach((node) => node.classList.remove('active'));
          b.classList.add('active');
          emit();
        });
        swatches.appendChild(b);
      }

      glow.value = String(Math.round(custom.glow * 100));
      power.value = String(Math.round(custom.power * 100));
      grip.value = String(Math.round(custom.grip * 100));
      wheel.value = String(Math.round((custom.wheel ?? 0.5) * 100));
      ride.value = String(Math.round((custom.rideHeight ?? 0.5) * 100));
      underglow.value = String(Math.round((custom.underglow ?? 0.35) * 100));
      tint.value = String(Math.round((custom.tint ?? 0.4) * 100));
      rims.value = String(Math.round((custom.rims ?? 0.45) * 100));
      camber.value = String(Math.round((custom.camber ?? 0.25) * 100));
      spoiler.value = String(Math.round((custom.spoiler ?? 0.35) * 100));
      livery.value = String(Math.round((custom.liveryStripe ?? 0.2) * 100));
      exhaust.value = custom.exhaustNote ?? 'stock';
      handling.value = custom.handling ?? 'grip';
      glow.oninput = emit;
      power.oninput = emit;
      grip.oninput = emit;
      wheel.oninput = emit;
      ride.oninput = emit;
      underglow.oninput = emit;
      tint.oninput = emit;
      rims.oninput = emit;
      camber.oninput = emit;
      spoiler.oninput = emit;
      livery.oninput = emit;
      exhaust.onchange = emit;
      handling.onchange = emit;
      el<HTMLButtonElement>('apply-custom').onclick = onApply;
    },
    bindReset(onReset) {
      resetBtn.addEventListener('click', onReset);
    },
    bindDynoPull(onPull) {
      const btn = document.getElementById('dyno-pull');
      btn?.addEventListener('click', onPull);
    }
  };
}

export function missionTextForPhase(phase: GamePhase, progress?: SavedProgress | null): string {
  if (progress) return missionBannerText(progress);
  if (phase === 'waymo_ride') return 'Prologue: Waymo to Vallejo estate';
  if (phase === 'pick_car') return 'Chapter 1: Vallejo — pick your starter';
  return 'Chapter 1: Vallejo — open the Bay';
}
