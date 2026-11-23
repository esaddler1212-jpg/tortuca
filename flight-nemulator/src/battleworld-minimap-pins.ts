import { hasDistrictSignatureBeat } from './arc-progress';
import { BATTLEWORLD_ARCS } from './battleworld-arcs';
import { districtForHero, spawnAtHome } from './districts';

export type MinimapPin = { x: number; z: number; label?: string };

/** Hero home tower — press H at home turf (bw-d09). */
export function homeMinimapPin(heroDistrictId: string): MinimapPin {
  const p = spawnAtHome(heroDistrictId);
  return { x: p.x, z: p.z, label: 'H' };
}

/** Arc signature district when home-mark / corps / squad beat is still open. */
export function arcMinimapPin(heroId: string, role: 'hero' | 'villain'): MinimapPin | null {
  if (role !== 'hero' || hasDistrictSignatureBeat(heroId)) return null;
  const arc = BATTLEWORLD_ARCS[heroId];
  if (!arc) return null;
  const d = districtForHero(arc.districtId);
  return { x: d.center.x, z: d.center.z };
}

/** Single-line objective for new players (arc + chapter + lattice). */
export function arcObjectiveChip(
  characterArcHint: string | null | undefined,
  chapterChainChip: string | null | undefined,
  latticeBeatChip: string | null | undefined,
  needsHomeH: boolean
): string | null {
  const parts: string[] = [];
  if (characterArcHint) {
    const short = characterArcHint.length > 72 ? `${characterArcHint.slice(0, 69)}…` : characterArcHint;
    parts.push(short);
  }
  if (chapterChainChip) parts.push(`Story ${chapterChainChip.replace(/^Story\s*/, '')}`);
  if (latticeBeatChip) parts.push(`Lattice ${latticeBeatChip.replace(/^Lattice\s*/, '')}`);
  if (needsHomeH) parts.push('Home H on minimap');
  if (!parts.length) return null;
  return parts.join(' · ');
}