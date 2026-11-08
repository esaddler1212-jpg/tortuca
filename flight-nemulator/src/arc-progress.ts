import { queueBattleworldLatticeCloud } from './battleworld-lattice-cloud';

const PREFIX = 'flight-nemulator-arc-beat-';
const LATTICE_KEY = 'flight-nemulator-battleworld-lattice';

export type ArcBeat =
  | 'pair-down'
  | 'territory-clear'
  | 'stone-linked'
  | 'world-saved'
  | 'corps-oath'
  | 'squad-clash'
  | 'hunt-ascended'
  | 'home-mark'
  | 'villain-apex';

export function recordArcBeat(heroId: string, beat: ArcBeat): void {
  localStorage.setItem(`${PREFIX}${heroId}-${beat}`, '1');
  const n = battleworldLatticeStrength();
  localStorage.setItem(LATTICE_KEY, String(n + 1));
  queueBattleworldLatticeCloud(heroId);
}

export function hasArcBeat(heroId: string, beat: ArcBeat): boolean {
  return localStorage.getItem(`${PREFIX}${heroId}-${beat}`) === '1';
}

export function battleworldLatticeStrength(): number {
  const raw = localStorage.getItem(LATTICE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

/** Hero cleared the last villain takeover district — once per hero save. */
export function maybeRecordTerritoryClear(
  heroId: string,
  role: 'hero' | 'villain',
  takeoverCount: number
): void {
  if (role !== 'hero' || takeoverCount !== 0) return;
  if (hasArcBeat(heroId, 'territory-clear')) return;
  recordArcBeat(heroId, 'territory-clear');
}

export function arcBeatsForHero(heroId: string): Set<ArcBeat> {
  const beats: ArcBeat[] = [
    'pair-down',
    'territory-clear',
    'stone-linked',
    'world-saved',
    'corps-oath',
    'squad-clash',
    'hunt-ascended',
    'home-mark',
    'villain-apex'
  ];
  const out = new Set<ArcBeat>();
  for (const b of beats) {
    if (hasArcBeat(heroId, b)) out.add(b);
  }
  return out;
}

export function hasDistrictSignatureBeat(heroId: string): boolean {
  return (
    hasArcBeat(heroId, 'corps-oath') ||
    hasArcBeat(heroId, 'squad-clash') ||
    hasArcBeat(heroId, 'home-mark')
  );
}

/** Compact lattice progress for HUD (hero / villain ladders). */
export function latticeBeatChip(heroId: string, role: 'hero' | 'villain'): string {
  const b = arcBeatsForHero(heroId);
  const tick = (ok: boolean, label: string) => `${ok ? '✓' : '○'}${label}`;
  if (role === 'villain') {
    const stones = b.has('stone-linked') || b.has('hunt-ascended');
    return [
      tick(stones, 'Stones'),
      tick(b.has('home-mark'), 'Turf'),
      tick(b.has('villain-apex'), 'Apex'),
      tick(b.has('hunt-ascended'), 'Ascend')
    ].join(' · ');
  }
  return [
    tick(b.has('territory-clear'), 'Territory'),
    tick(b.has('stone-linked'), 'Stones'),
    tick(hasDistrictSignatureBeat(heroId), 'Home H'),
    tick(b.has('pair-down'), 'Pair'),
    tick(b.has('world-saved'), 'Save')
  ].join(' · ');
}
