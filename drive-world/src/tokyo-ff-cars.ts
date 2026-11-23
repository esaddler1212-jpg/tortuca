/**
 * Tokyo bonus rides — Fast & Furious / Tokyo Drift fan tributes (not affiliated).
 * One car unlocks per Tokyo landmark; capstone at Odaiba.
 */
import type { SavedProgress } from './game-progress';

export const TOKYO_FF_GARAGE_LABEL = 'Tokyo · Fast & Furious garage';
export const TOKYO_MINIMAP_TITLE = 'Tokyo · FF bonus map';

export const TOKYO_LANDMARK_VEHICLE: Record<string, string> = {
  'tk-shibuya': 'tokyo-drift-monarch',
  'tk-tokyo-tower': 'tokyo-teal-phantom',
  'tk-shinjuku': 'tokyo-kabuki-z',
  'tk-ginza': 'tokyo-gold-linx',
  'tk-akihabara': 'tokyo-neon-evo',
  'tk-c1': 'tokyo-c1-boost',
  'tk-daikoku': 'tokyo-family-van',
  'tk-odaiba': 'tokyo-shuto-runner'
};

export const ALL_TOKYO_VEHICLE_IDS = [...new Set(Object.values(TOKYO_LANDMARK_VEHICLE))];

/** Exclude every Tokyo ride from the Bay “unlock flight” catalog count. */
export function isTokyoBonusVehicle(id: string): boolean {
  return ALL_TOKYO_VEHICLE_IDS.includes(id);
}

export function tokyoVehicleForLandmark(landmarkId: string): string | null {
  return TOKYO_LANDMARK_VEHICLE[landmarkId] ?? null;
}

export function tokyoFleetUnlockedCount(progress: SavedProgress): number {
  return ALL_TOKYO_VEHICLE_IDS.filter((id) => progress.unlockedVehicleIds.includes(id)).length;
}

/** F&F palette for Daikoku PA props (diffuse, emissive, intensity). */
export const TOKYO_FF_PARKED_CARS: [number, number, number][] = [
  [0.95, 0.42, 0.08], // scramble orange
  [0.75, 0.78, 0.82], // silver
  [0.08, 0.08, 0.1], // black widebody
  [0.85, 0.72, 0.22], // gold
  [0.12, 0.65, 0.35], // neon green
  [0.92, 0.92, 0.94], // white
  [0.55, 0.85, 0.92], // teal accent
  [0.95, 0.15, 0.2], // family red
  [0.2, 0.22, 0.28], // gunmetal
  [0.98, 0.55, 0.12] // sunset orange
];
