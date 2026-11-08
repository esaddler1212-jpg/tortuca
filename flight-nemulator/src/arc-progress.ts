const PREFIX = 'flight-nemulator-arc-beat-';
const LATTICE_KEY = 'flight-nemulator-battleworld-lattice';

export type ArcBeat =
  | 'pair-down'
  | 'territory-clear'
  | 'stone-linked'
  | 'world-saved'
  | 'corps-oath'
  | 'squad-clash'
  | 'hunt-ascended';

export function recordArcBeat(heroId: string, beat: ArcBeat): void {
  localStorage.setItem(`${PREFIX}${heroId}-${beat}`, '1');
  const n = battleworldLatticeStrength();
  localStorage.setItem(LATTICE_KEY, String(n + 1));
}

export function hasArcBeat(heroId: string, beat: ArcBeat): boolean {
  return localStorage.getItem(`${PREFIX}${heroId}-${beat}`) === '1';
}

export function battleworldLatticeStrength(): number {
  const raw = localStorage.getItem(LATTICE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function arcBeatsForHero(heroId: string): Set<ArcBeat> {
  const beats: ArcBeat[] = [
    'pair-down',
    'territory-clear',
    'stone-linked',
    'world-saved',
    'corps-oath',
    'squad-clash',
    'hunt-ascended'
  ];
  const out = new Set<ArcBeat>();
  for (const b of beats) {
    if (hasArcBeat(heroId, b)) out.add(b);
  }
  return out;
}
