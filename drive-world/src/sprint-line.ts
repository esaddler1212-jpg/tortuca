/** 0–1 progress along a sprint start→finish line (for ghost splits). */
export function sprintLineProgress(
  px: number,
  pz: number,
  start: { x: number; z: number },
  finish: { x: number; z: number }
): number {
  const dx = finish.x - start.x;
  const dz = finish.z - start.z;
  const len2 = dx * dx + dz * dz;
  if (len2 < 1) return 0;
  const t = ((px - start.x) * dx + (pz - start.z) * dz) / len2;
  return Math.max(0, Math.min(1, t));
}
