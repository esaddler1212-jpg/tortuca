import type { DragStripDef } from './cpm-challenges';
import type { SavedProgress } from './game-progress';

export type CpmGhostTape = {
  kind: 'drag' | 'time';
  id: string;
  valueMs: number;
  /** Elapsed ms at 0%, 25%, 50%, 75%, 100% progress along the run. */
  splits: number[];
};

const SPLIT_COUNT = 5;
let runSamples = new Array<number>(SPLIT_COUNT).fill(-1);
let activeKey: string | null = null;

export function tapeKey(kind: 'drag' | 'time', id: string): string {
  return `${kind}:${id}`;
}

export function dragProgress01(px: number, strip: DragStripDef): number {
  const span = strip.endX - strip.startX;
  if (Math.abs(span) < 1) return 0;
  return Math.max(0, Math.min(1, (px - strip.startX) / span));
}

export function resetGhostRun(kind: 'drag' | 'time', id: string): void {
  activeKey = tapeKey(kind, id);
  runSamples = new Array<number>(SPLIT_COUNT).fill(-1);
}

export function clearGhostRun(): void {
  activeKey = null;
  runSamples = new Array<number>(SPLIT_COUNT).fill(-1);
}

export function sampleGhostRun(progress01: number, elapsedMs: number): void {
  if (!activeKey) return;
  const idx = Math.min(SPLIT_COUNT - 1, Math.floor(progress01 * SPLIT_COUNT));
  if (runSamples[idx]! < 0) runSamples[idx] = elapsedMs;
  if (progress01 > 0.98) runSamples[SPLIT_COUNT - 1] = elapsedMs;
}

export function seedGhostTapes(progress: SavedProgress): SavedProgress {
  const tapes: Record<string, CpmGhostTape> = { ...(progress.cpmGhostTapes ?? {}) };
  if (progress.cpmDragBestET != null && progress.cpmDragBestET > 0 && !tapes['drag:mare-quarter']) {
    const ms = progress.cpmDragBestET * 1000;
    tapes['drag:mare-quarter'] = {
      kind: 'drag',
      id: 'mare-quarter',
      valueMs: ms,
      splits: [0, ms * 0.25, ms * 0.5, ms * 0.75, ms]
    };
  }
  for (const [id, ms] of Object.entries(progress.cpmTimeAttackMs ?? {})) {
    const key = tapeKey('time', id);
    if (ms > 0 && !tapes[key]) {
      tapes[key] = {
        kind: 'time',
        id,
        valueMs: ms,
        splits: [0, ms * 0.25, ms * 0.5, ms * 0.75, ms]
      };
    }
  }
  if (Object.keys(tapes).length === Object.keys(progress.cpmGhostTapes ?? {}).length) return progress;
  return { ...progress, cpmGhostTapes: tapes };
}

export function storeGhostTapeIfPb(
  progress: SavedProgress,
  kind: 'drag' | 'time',
  id: string,
  valueMs: number,
  isPb: boolean
): SavedProgress {
  if (!isPb) return progress;
  const filled = [...runSamples];
  if (filled.every((v) => v < 0)) {
    for (let i = 0; i < SPLIT_COUNT; i++) filled[i] = (valueMs * i) / (SPLIT_COUNT - 1);
  } else {
    let last = 0;
    for (let i = 0; i < SPLIT_COUNT; i++) {
      if (filled[i]! < 0) filled[i] = last;
      else last = filled[i]!;
    }
    filled[SPLIT_COUNT - 1] = valueMs;
  }
  const key = tapeKey(kind, id);
  return {
    ...progress,
    cpmGhostTapes: {
      ...(progress.cpmGhostTapes ?? {}),
      [key]: { kind, id, valueMs, splits: filled }
    }
  };
}

export function ghostHudLabel(
  progress: SavedProgress,
  kind: 'drag' | 'time',
  id: string,
  progress01: number,
  elapsedMs: number
): string | null {
  const tape = progress.cpmGhostTapes?.[tapeKey(kind, id)];
  if (!tape || tape.splits.length < 2) return null;
  const idx = Math.min(tape.splits.length - 1, Math.floor(progress01 * tape.splits.length));
  const ghostMs = tape.splits[idx] ?? tape.valueMs * progress01;
  const deltaSec = (elapsedMs - ghostMs) / 1000;
  if (Math.abs(deltaSec) < 0.04) return 'On ghost pace';
  const sign = deltaSec > 0 ? '+' : '';
  return `${sign}${deltaSec.toFixed(2)}s vs ghost`;
}

export function ghostEntityPosition(
  progress: SavedProgress,
  strip: DragStripDef,
  progress01: number
): { x: number; z: number } | null {
  const tape = progress.cpmGhostTapes?.[tapeKey('drag', strip.id)];
  if (!tape) return null;
  const t = Math.max(0, Math.min(1, progress01 - 0.08));
  const x = strip.startX + (strip.endX - strip.startX) * t;
  const z = strip.startZ + (strip.endZ - strip.startZ) * t;
  return { x, z };
}
