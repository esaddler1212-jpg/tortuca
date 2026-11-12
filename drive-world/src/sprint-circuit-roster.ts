import type { SavedProgress } from './game-progress';
import { LANDMARK_SPRINTS, type LandmarkSprintDef } from './landmark-sprints';

/** Ghost sprint circuit — Day 4 roster (three marked ghost routes). */
export const GHOST_SPRINT_CIRCUIT: LandmarkSprintDef[] = LANDMARK_SPRINTS.filter((s) => s.ghostTape);

export type GhostCircuitMapLine = {
  id: string;
  name: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  pbMs: number;
};

export function ghostCircuitMapLines(progress: SavedProgress | null): GhostCircuitMapLine[] {
  return GHOST_SPRINT_CIRCUIT.map((s) => ({
    id: s.id,
    name: s.name,
    x1: s.start.x,
    z1: s.start.z,
    x2: s.finish.x,
    z2: s.finish.z,
    pbMs: progress?.landmarkSprintMs[s.id] ?? 0
  }));
}

export function ghostCircuitRosterLabel(progress: SavedProgress | null): string {
  const lines = ghostCircuitMapLines(progress);
  return lines
    .map((l, i) => {
      const pb = l.pbMs > 0 ? `${(l.pbMs / 1000).toFixed(1)}s` : '—';
      return `${i + 1}:${pb}`;
    })
    .join(' · ');
}
