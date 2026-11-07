/** Read focus-mode accent from CSS variables (space-separated RGB triplets). */

export type HudAccent = {
  /** --accent-300 */
  light: [number, number, number];
  /** --accent-400 */
  mid: [number, number, number];
  /** --accent-500 */
  core: [number, number, number];
  /** --accent-600 */
  deep: [number, number, number];
};

function parseTriplet(raw: string, fallback: [number, number, number]): [number, number, number] {
  const parts = raw
    .trim()
    .split(/\s+/)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
  if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  return fallback;
}

export function readHudAccent(): HudAccent {
  const root = document.documentElement;
  const s = getComputedStyle(root);
  const fb: HudAccent = {
    light: [103, 232, 249],
    mid: [34, 211, 238],
    core: [6, 182, 212],
    deep: [8, 145, 178],
  };
  return {
    light: parseTriplet(s.getPropertyValue("--accent-300"), fb.light),
    mid: parseTriplet(s.getPropertyValue("--accent-400"), fb.mid),
    core: parseTriplet(s.getPropertyValue("--accent-500"), fb.core),
    deep: parseTriplet(s.getPropertyValue("--accent-600"), fb.deep),
  };
}

export function rgba(c: [number, number, number], a: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}
