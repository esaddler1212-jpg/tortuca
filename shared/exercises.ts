/**
 * Exercise library (names, muscles, equipment, how-to steps) from the
 * MIT-licensed exercises-dataset; see public/exercises.LICENSE.txt. Media is
 * not included. Loaded on demand from /exercises.json.
 */
export interface LibExercise {
  id: string;
  /** name */
  n: string;
  /** body part */
  b: string;
  /** equipment */
  eq: string;
  /** target muscle */
  t: string;
  /** secondary muscles */
  m2: string[];
  /** how-to steps */
  s: string[];
}

export type EquipmentGroup = "Bodyweight" | "Dumbbell" | "Barbell" | "Cable" | "Machine" | "Bands" | "Other";
export const EQUIPMENT_GROUPS: EquipmentGroup[] = ["Bodyweight", "Dumbbell", "Barbell", "Cable", "Machine", "Bands", "Other"];

export function equipmentGroup(eq: string): EquipmentGroup {
  const e = eq.toLowerCase();
  if (/body weight|assisted|weighted/.test(e)) return "Bodyweight";
  if (/dumbbell|kettlebell/.test(e)) return "Dumbbell";
  if (/barbell|trap bar/.test(e)) return "Barbell";
  if (/cable|rope/.test(e)) return "Cable";
  if (/machine|leverage|sled|bike|ergometer|skierg|elliptical|stepmill/.test(e)) return "Machine";
  if (/band/.test(e)) return "Bands";
  return "Other";
}

/** "barbell bench press" → "Barbell bench press". */
export function displayName(n: string): string {
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Camera-angle and gender duplicates ("(side pov)", "(male)") add noise to pickers. */
function isVariantDuplicate(n: string): boolean {
  return /\b(pov|male|female)\)|\bv\. ?\d/.test(n);
}

const EQUIP_WORDS = /^(barbell|dumbbell|cable|lever|band|smith|kettlebell|ez|sled|weighted|assisted|bodyweight|machine)$/;
function nameWords(n: string): Set<string> {
  return new Set(n.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !EQUIP_WORDS.test(w)));
}
function overlap(a: string, b: string): number {
  const wa = nameWords(a);
  let n = 0;
  for (const w of nameWords(b)) if (wa.has(w)) n++;
  return n;
}

/** Replacements that work the same target muscle, nearest match first. */
export function swapCandidates(
  lib: LibExercise[],
  current: LibExercise,
  allowed: Set<EquipmentGroup> | null,
  limit = 8,
): LibExercise[] {
  return lib
    .filter((x) => x.id !== current.id && x.t === current.t && !isVariantDuplicate(x.n))
    .filter((x) => !allowed || allowed.has(equipmentGroup(x.eq)))
    .sort((a, b) => {
      const score = (x: LibExercise) =>
        (x.b === current.b ? 0 : 2) + (equipmentGroup(x.eq) === equipmentGroup(current.eq) ? 0 : 1);
      return (
        score(a) - score(b) ||
        overlap(current.n, b.n) - overlap(current.n, a.n) || // same movement first ("bench press")
        a.n.length - b.n.length ||
        a.n.localeCompare(b.n)
      );
    })
    .slice(0, limit);
}

/** Every word must appear in the name (or muscle/equipment); shortest names first. */
export function searchExercises(lib: LibExercise[], query: string, limit = 12): LibExercise[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const pool = lib.filter((x) => !isVariantDuplicate(x.n));
  const hits = (x: LibExercise) => words.filter((w) => `${x.n} ${x.t} ${x.eq} ${x.b}`.includes(w)).length;
  const phrase = words.join(" ");
  const inName = (x: LibExercise) => (x.n.includes(phrase) ? 100 : 0) + words.filter((w) => x.n.includes(w)).length;
  // Exact phrase in the name first, then more query words in the name, then shorter names.
  const byLength = (a: LibExercise, b: LibExercise) => inName(b) - inName(a) || a.n.length - b.n.length || a.n.localeCompare(b.n);
  const all = pool.filter((x) => hits(x) === words.length).sort(byLength);
  if (all.length || words.length === 1) return all.slice(0, limit);
  // Nothing matches every word ("face pull"): show the closest partial matches.
  return pool
    .map((x) => ({ x, h: hits(x) }))
    .filter((r) => r.h > 0)
    .sort((a, b) => b.h - a.h || byLength(a.x, b.x))
    .slice(0, limit)
    .map((r) => r.x);
}

/** Track weight unless it's bodyweight or cardio. */
export function isWeighted(x: LibExercise): boolean {
  return equipmentGroup(x.eq) !== "Bodyweight" && x.t !== "cardiovascular system";
}
