/**
 * Ground height snap — OpenWorldJS uses GPU height + rays; Bay uses analytic terrain.
 */
import { hillOffsetM } from '../bay-terrain';

export type GroundSnapSample = {
  x: number;
  z: number;
  y: number;
};

/** Snap entity Y so its base sits on Bay terrain (+ clearance). */
export function snapToBayGround(x: number, z: number, clearanceM = 1.35): number {
  return hillOffsetM(x, z) + clearanceM;
}

export function snapPositionToBayGround(
  x: number,
  z: number,
  clearanceM = 1.35
): GroundSnapSample {
  return { x, z, y: snapToBayGround(x, z, clearanceM) };
}
