import { DISTRICTS } from './districts';

const KEY_PREFIX = 'flight-nemulator-district-stars-';

export type DistrictStars = { stars: 0 | 1 | 2 | 3 };

function readStars(districtId: string): DistrictStars {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${districtId}`);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    const stars = Math.max(0, Math.min(3, Number.isFinite(n) ? n : 0)) as 0 | 1 | 2 | 3;
    return { stars };
  } catch {
    return { stars: 0 };
  }
}

function writeStars(districtId: string, stars: 0 | 1 | 2 | 3): void {
  const prev = readStars(districtId).stars;
  if (stars <= prev) return;
  localStorage.setItem(`${KEY_PREFIX}${districtId}`, String(stars));
}

/** Star 1 — fly within district radius. */
export function noteDistrictVisit(districtId: string | null): void {
  if (!districtId) return;
  if (readStars(districtId).stars >= 1) return;
  writeStars(districtId, 1);
}

/** Star 2 — clear a wave or end a takeover contest in this district. */
export function noteDistrictAction(districtId: string | null): void {
  if (!districtId) return;
  const cur = readStars(districtId).stars;
  if (cur < 1) writeStars(districtId, 1);
  if (cur >= 2) return;
  writeStars(districtId, 2);
}

/** Star 3 — pair down, territory clear, or villain apex beat while relevant. */
export function noteDistrictMastery(districtId: string | null): void {
  if (!districtId) return;
  noteDistrictAction(districtId);
  if (readStars(districtId).stars >= 3) return;
  writeStars(districtId, 3);
}

export function districtStarsSummary(): { districts3: number; total: number } {
  let districts3 = 0;
  for (const d of DISTRICTS) {
    if (readStars(d.id).stars >= 3) districts3++;
  }
  return { districts3, total: DISTRICTS.length };
}

export function districtStarsChip(districtId: string | null): string | null {
  if (!districtId) return null;
  const { stars } = readStars(districtId);
  if (stars === 0) return null;
  return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} district`;
}