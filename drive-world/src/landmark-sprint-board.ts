import type { SavedProgress } from './game-progress';

export const SPRINT_BOARD_MAX = 3;

/** Local-only top times (ms), best first — no server sync. */
export function recordLandmarkSprintBoard(
  progress: SavedProgress,
  sprintId: string,
  ms: number
): SavedProgress {
  const prev = progress.landmarkSprintTop3?.[sprintId] ?? [];
  const next = [...prev, ms].sort((a, b) => a - b).slice(0, SPRINT_BOARD_MAX);
  return {
    ...progress,
    landmarkSprintTop3: { ...(progress.landmarkSprintTop3 ?? {}), [sprintId]: next },
  };
}

export function formatSprintBoardLine(times: number[] | undefined): string {
  if (!times?.length) return '—';
  return times.map((t) => `${(t / 1000).toFixed(1)}s`).join(' / ');
}