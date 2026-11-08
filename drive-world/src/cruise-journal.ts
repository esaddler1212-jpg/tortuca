import type { SavedProgress, JournalEntry } from './game-progress';
import { CRUISE_VISTAS } from './cruise-vistas';
import { getVehicleSpec, VEHICLE_CATALOG } from './vehicle-catalog';
import { saveProgress } from './game-progress';

const MAX_ENTRIES = 48;

export function appendJournal(
  progress: SavedProgress,
  entry: Omit<JournalEntry, 't'>
): SavedProgress {
  const row: JournalEntry = { ...entry, t: Date.now() };
  const journal = [row, ...(progress.journal ?? [])].slice(0, MAX_ENTRIES);
  const next = { ...progress, journal };
  saveProgress(next);
  return next;
}

export function favoriteVehicleId(progress: SavedProgress): string | null {
  let best: string | null = null;
  let bestMiles = 0;
  for (const [id, st] of Object.entries(progress.vehicleStats)) {
    if (st.miles > bestMiles) {
      bestMiles = st.miles;
      best = id;
    }
  }
  return best;
}

export function journalLines(progress: SavedProgress): string[] {
  const lines: string[] = [];
  const fav = favoriteVehicleId(progress);
  if (fav) {
    lines.push(`Favorite cruiser: ${getVehicleSpec(fav).name} (${progress.vehicleStats[fav]?.miles.toFixed(1) ?? 0} mi)`);
  }
  lines.push(`Vistas logged: ${progress.visitedVistaIds.length}/${CRUISE_VISTAS.length}`);
  lines.push(`Landmarks: ${progress.visitedLandmarkIds.length}`);
  const recent = (progress.journal ?? []).slice(0, 8);
  for (const e of recent) {
    const kind = e.kind === 'vista' ? 'Vista' : e.kind === 'scenic' ? 'Scenic' : 'Landmark';
    lines.push(`${kind}: ${e.label}`);
  }
  return lines;
}

export function vehicleName(id: string): string {
  return VEHICLE_CATALOG[id]?.name ?? id;
}
