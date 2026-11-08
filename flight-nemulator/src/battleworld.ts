/** Fan-tribute framing: one patchwork planet where Marvel, DC, and DBZ rosters collide. */

export const BATTLEWORLD_NAME = 'Battleworld';

export const BATTLEWORLD_TAGLINE =
  'Your patchwork planet — Marvel, DC, and DBZ legends share one sky ring.';

export type BattleworldUniverse = 'marvel' | 'dc' | 'dbz';

export const BATTLEWORLD_UNIVERSES: { id: BattleworldUniverse; label: string }[] = [
  { id: 'marvel', label: 'Marvel homage' },
  { id: 'dc', label: 'DC homage' },
  { id: 'dbz', label: 'DBZ homage' }
];

export function battleworldDistrictLabel(districtLabel: string): string {
  return `${BATTLEWORLD_NAME} · ${districtLabel}`;
}

export function battleworldRoleBlurb(role: 'hero' | 'villain'): string {
  if (role === 'villain') {
    return 'Battleworld — raid rival districts, mark territory, trade tips with rogue advisors';
  }
  return 'Battleworld — push back takeovers, then face your scripted pair rival at wave 10';
}
