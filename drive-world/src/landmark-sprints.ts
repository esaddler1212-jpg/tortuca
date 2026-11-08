import type { SavedProgress } from './game-progress';
import { saveProgress } from './game-progress';

export type LandmarkSprintDef = {
  id: string;
  name: string;
  fromLabel: string;
  toLabel: string;
  start: { x: number; z: number; radius: number };
  finish: { x: number; z: number; radius: number };
};

/** Point-to-point MC-style sprints (ghost uses best ms in progress). */
export const LANDMARK_SPRINTS: LandmarkSprintDef[] = [
  {
    id: 'vallejo-estate-mare',
    name: 'Estate → Mare crane',
    fromLabel: 'Vallejo estate',
    toLabel: 'Mare Island crane',
    start: { x: 500, z: 900, radius: 38 },
    finish: { x: 420, z: 1020, radius: 42 }
  },
  {
    id: 'mare-carquinez',
    name: 'Mare → Carquinez tower',
    fromLabel: 'Mare Island',
    toLabel: 'Carquinez tower',
    start: { x: 420, z: 1020, radius: 40 },
    finish: { x: 580, z: 1180, radius: 40 }
  },
  {
    id: 'sf-bridge-vista',
    name: 'Bridge → Vista point',
    fromLabel: 'Golden Gate south',
    toLabel: 'Twin Peaks vista',
    start: { x: -920, z: -520, radius: 48 },
    finish: { x: -780, z: -380, radius: 44 }
  }
];

type SprintRuntime = {
  sprintId: string | null;
  startedMs: number | null;
};

export function freshSprintRuntime(): SprintRuntime {
  return { sprintId: null, startedMs: null };
}

function inCircle(px: number, pz: number, x: number, z: number, r: number): boolean {
  return (px - x) ** 2 + (pz - z) ** 2 <= r * r;
}

export function tickLandmarkSprint(
  rt: SprintRuntime,
  progress: SavedProgress,
  px: number,
  pz: number,
  mph: number,
  nowMs: number
): { rt: SprintRuntime; progress: SavedProgress; toast?: { title: string; body: string } } {
  let nextProgress = progress;
  for (const sprint of LANDMARK_SPRINTS) {
    if (rt.sprintId === sprint.id) {
      if (inCircle(px, pz, sprint.finish.x, sprint.finish.z, sprint.finish.radius)) {
        const elapsed = rt.startedMs != null ? nowMs - rt.startedMs : 0;
        if (elapsed > 1500) {
          const prev = progress.landmarkSprintMs[sprint.id] ?? 0;
          const pb = prev === 0 || elapsed < prev;
          if (pb) {
            nextProgress = {
              ...progress,
              landmarkSprintMs: { ...progress.landmarkSprintMs, [sprint.id]: Math.round(elapsed) }
            };
            saveProgress(nextProgress);
          }
          const sec = (elapsed / 1000).toFixed(2);
          return {
            rt: freshSprintRuntime(),
            progress: nextProgress,
            toast: {
              title: pb ? 'Sprint PB!' : 'Sprint finished',
              body: `${sprint.name} · ${sec}s`
            }
          };
        }
        return { rt: freshSprintRuntime(), progress: nextProgress };
      }
      continue;
    }
    if (mph > 12 && inCircle(px, pz, sprint.start.x, sprint.start.z, sprint.start.radius)) {
      return {
        rt: { sprintId: sprint.id, startedMs: nowMs },
        progress: nextProgress,
        toast: { title: 'Sprint armed', body: `${sprint.toLabel} — keep speed` }
      };
    }
  }
  return { rt, progress: nextProgress };
}

export function activeSprintLabel(rt: SprintRuntime): string | null {
  if (!rt.sprintId) return null;
  return LANDMARK_SPRINTS.find((s) => s.id === rt.sprintId)?.name ?? null;
}
