import {
  DRIFT_PADS,
  DRAG_STRIPS,
  TIME_ATTACKS,
  type CpmZoneHit,
  type DriftPadDef,
  type DragStripDef,
  type TimeAttackDef
} from './cpm-challenges';
import type { SavedProgress } from './game-progress';

function inCircle(px: number, pz: number, x: number, z: number, r: number): boolean {
  return (px - x) ** 2 + (pz - z) ** 2 <= r * r;
}

function crossStartGate(px: number, pz: number, strip: DragStripDef): boolean {
  const midZ = strip.startZ;
  return (
    Math.abs(pz - midZ) < strip.gateWidth &&
    px >= strip.startX - 8 &&
    px <= strip.startX + 8
  );
}

function crossFinishGate(px: number, pz: number, strip: DragStripDef): boolean {
  return Math.abs(pz - strip.startZ) < strip.gateWidth && px >= strip.endX - 10;
}

export type CpmRuntime = {
  driftScore: number;
  driftPadId: string | null;
  dragStripId: string | null;
  dragLaunchT: number | null;
  timeAttackId: string | null;
  timeGateIndex: number;
  timeLapStartMs: number | null;
};

export function freshCpmRuntime(): CpmRuntime {
  return {
    driftScore: 0,
    driftPadId: null,
    dragStripId: null,
    dragLaunchT: null,
    timeAttackId: null,
    timeGateIndex: 0,
    timeLapStartMs: null
  };
}

export function nearestDriftPad(px: number, pz: number): DriftPadDef | null {
  for (const pad of DRIFT_PADS) {
    if (inCircle(px, pz, pad.x, pad.z, pad.radius)) return pad;
  }
  return null;
}

/** Lateral slide scoring (CPM-style smoke meter). */
export function tickDriftScore(
  rt: CpmRuntime,
  px: number,
  pz: number,
  mph: number,
  yawRateDegPerSec: number,
  dt: number
): CpmRuntime {
  const pad = nearestDriftPad(px, pz);
  if (!pad || mph < 12) {
    return { ...rt, driftScore: 0, driftPadId: null };
  }
  const lateral = Math.abs(yawRateDegPerSec) * 0.04 + Math.min(mph, 55) * 0.02;
  const add = lateral * dt * 12;
  const score = pad.id === rt.driftPadId ? rt.driftScore + add : add;
  return { ...rt, driftPadId: pad.id, driftScore: score };
}

export function tickDragStrip(
  rt: CpmRuntime,
  px: number,
  pz: number,
  mph: number,
  nowMs: number
): { rt: CpmRuntime; hit?: CpmZoneHit } {
  for (const strip of DRAG_STRIPS) {
    if (crossStartGate(px, pz, strip) && mph > 8 && rt.dragStripId !== strip.id) {
      return {
        rt: { ...rt, dragStripId: strip.id, dragLaunchT: nowMs },
        hit: { kind: 'drag-start', strip }
      };
    }
    if (rt.dragStripId === strip.id && rt.dragLaunchT != null && crossFinishGate(px, pz, strip)) {
      const etSec = (nowMs - rt.dragLaunchT) / 1000;
      return {
        rt: freshCpmRuntime(),
        hit: { kind: 'drag-finish', strip, etSec }
      };
    }
  }
  return { rt };
}

export function tickTimeAttack(
  rt: CpmRuntime,
  px: number,
  pz: number,
  nowMs: number
): { rt: CpmRuntime; hit?: CpmZoneHit } {
  for (const attack of TIME_ATTACKS) {
    const gate = attack.gates[rt.timeGateIndex];
    if (!gate) continue;
    if (rt.timeAttackId !== attack.id) {
      if (inCircle(px, pz, attack.gates[0]!.x, attack.gates[0]!.z, attack.gates[0]!.radius)) {
        return {
          rt: {
            ...rt,
            timeAttackId: attack.id,
            timeGateIndex: 1,
            timeLapStartMs: nowMs
          },
          hit: { kind: 'time-gate', attack, gateIndex: 0 }
        };
      }
      continue;
    }
    if (inCircle(px, pz, gate.x, gate.z, gate.radius)) {
      const nextIdx = rt.timeGateIndex + 1;
      if (nextIdx >= attack.gates.length) {
        const ms = rt.timeLapStartMs != null ? nowMs - rt.timeLapStartMs : 0;
        return {
          rt: freshCpmRuntime(),
          hit: { kind: 'time-finish', attack, ms }
        };
      }
      return {
        rt: { ...rt, timeGateIndex: nextIdx },
        hit: { kind: 'time-gate', attack, gateIndex: rt.timeGateIndex }
      };
    }
  }
  return { rt };
}

export function applyCpmHit(progress: SavedProgress, hit: CpmZoneHit): SavedProgress {
  if (hit.kind === 'drag-finish') {
    const best = progress.cpmDragBestET;
    const et = hit.etSec;
    if (best == null || et < best) {
      return { ...progress, cpmDragBestET: et };
    }
    return progress;
  }
  if (hit.kind === 'time-finish' && hit.ms > 0) {
    const prev = progress.cpmTimeAttackMs[hit.attack.id];
    if (prev == null || hit.ms < prev) {
      return {
        ...progress,
        cpmTimeAttackMs: { ...progress.cpmTimeAttackMs, [hit.attack.id]: hit.ms }
      };
    }
  }
  return progress;
}

export function flushDriftBest(progress: SavedProgress, padId: string, score: number): SavedProgress {
  const prev = progress.cpmDriftBests[padId] ?? 0;
  if (score <= prev) return progress;
  return { ...progress, cpmDriftBests: { ...progress.cpmDriftBests, [padId]: Math.round(score) } };
}
