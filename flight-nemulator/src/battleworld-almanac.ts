import { BATTLEWORLD_SAFE_HOUSES } from './battleworld-safe-houses';
import { BATTLEWORLD_ARCS } from './battleworld-arcs';
import { DISTRICTS } from './districts';
import {
  arcBeatsForHero,
  hasArcBeat,
  hasDistrictSignatureBeat,
  type ArcBeat
} from './arc-progress';

export type AlmanacEntry = {
  id: string;
  label: string;
  category: 'district' | 'safe' | 'arc' | 'lattice';
  discovered: boolean;
  hint?: string;
};

const BEAT_LABEL: Record<ArcBeat, string> = {
  'pair-down': 'Pair rival down',
  'territory-clear': 'Lattice territory clear',
  'stone-linked': 'Infinity stone linked',
  'world-saved': 'World saved above 52%',
  'corps-oath': 'Corps oath at home',
  'squad-clash': 'Ki squad clash',
  'hunt-ascended': 'Hunt ascended',
  'home-mark': 'Home turf mark (H)',
  'villain-apex': 'Villain apex lattice'
};

/** Discovery book — up to 72 entries derived from districts, safe houses, arcs, lattice beats. */
export function buildAlmanac(heroId: string): AlmanacEntry[] {
  const beats = arcBeatsForHero(heroId);
  const entries: AlmanacEntry[] = [];

  for (const d of DISTRICTS) {
    const arc = Object.values(BATTLEWORLD_ARCS).find((a) => a.districtId === d.id);
    entries.push({
      id: `district-${d.id}`,
      label: d.label,
      category: 'district',
      discovered:
        hasArcBeat(heroId, 'home-mark') ||
        hasArcBeat(heroId, 'territory-clear') ||
        beats.size >= 2,
      hint: arc?.title ?? d.inspiration
    });
  }

  for (const house of BATTLEWORLD_SAFE_HOUSES) {
    const district = DISTRICTS.find((d) => d.id === house.districtId)?.label ?? house.districtId;
    entries.push({
      id: `safe-${house.id}`,
      label: house.label,
      category: 'safe',
      discovered: hasDistrictSignatureBeat(heroId) || beats.has('territory-clear'),
      hint: `Rest lattice near ${district}`
    });
  }

  const arc = BATTLEWORLD_ARCS[heroId];
  if (arc) {
    entries.push({
      id: `arc-${heroId}`,
      label: arc.title,
      category: 'arc',
      discovered: beats.has('pair-down') || beats.has('villain-apex'),
      hint: arc.thread
    });
  }

  for (const beat of beats) {
    entries.push({
      id: `beat-${beat}`,
      label: BEAT_LABEL[beat],
      category: 'lattice',
      discovered: true
    });
  }

  return entries.slice(0, 72);
}

export function almanacSummary(heroId: string): { found: number; total: number } {
  const rows = buildAlmanac(heroId);
  const discovered = rows.filter((r) => r.discovered).length;
  return { found: discovered, total: Math.max(rows.length, 1) };
}