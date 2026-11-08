import type { SavedProgress } from './game-progress';

/** Retired vehicle ids → current catalog ids (runs on every load). */
const RENAMED_VEHICLES: Record<string, string> = {
  'bonus-meet-racer': 'meet-vallejo-lot'
};

export function migrateRenamedVehicles(progress: SavedProgress): SavedProgress {
  let unlocked = [...progress.unlockedVehicleIds];
  let active = progress.activeVehicleId;
  let customizations = { ...progress.customizations };
  let changed = false;

  for (const [oldId, newId] of Object.entries(RENAMED_VEHICLES)) {
    if (!unlocked.includes(oldId) && active !== oldId && !customizations[oldId]) continue;
    if (unlocked.includes(oldId)) {
      unlocked = unlocked.filter((id) => id !== oldId);
      if (!unlocked.includes(newId)) unlocked.push(newId);
      changed = true;
    }
    if (active === oldId) {
      active = newId;
      changed = true;
    }
    if (customizations[oldId]) {
      customizations[newId] = customizations[oldId]!;
      delete customizations[oldId];
      changed = true;
    }
  }

  if (!changed) return progress;
  return { ...progress, unlockedVehicleIds: unlocked, activeVehicleId: active, customizations };
}
