import { HERO_ROSTER, getHero, type HeroSpec } from './hero-roster';
import { VILLAIN_CLONES, villainRivalsForHero } from './villain-roster';

export { villainRivalsForHero };

/** Hero interceptors when you fly as a rogue caped figure. */
export function pickHeroInterceptor(playerHeroId: string, wave: number, slot: number): HeroSpec {
  const priorityIds = new Set<string>();
  for (const v of VILLAIN_CLONES) {
    if (v.rivalHeroIds.includes(playerHeroId)) {
      for (const id of v.rivalHeroIds) {
        if (id !== playerHeroId) priorityIds.add(id);
      }
      for (const h of HERO_ROSTER) {
        if (h.id !== playerHeroId && h.districtId === getHero(playerHeroId)?.districtId) {
          priorityIds.add(h.id);
        }
      }
    }
  }
  const pool =
    priorityIds.size > 0
      ? [...priorityIds].map((id) => getHero(id)).filter((h): h is HeroSpec => !!h)
      : HERO_ROSTER.filter((h) => h.id !== playerHeroId);
  return pool[(wave + slot) % pool.length] ?? HERO_ROSTER[0]!;
}

/** District home heroes rush in when a villain raids their turf. */
export function pickHeroDefenderForDistrict(
  districtId: string,
  wave: number,
  slot: number,
  excludeId: string
): HeroSpec {
  const local = HERO_ROSTER.filter((h) => h.districtId === districtId && h.id !== excludeId);
  if (local.length > 0) return local[(wave + slot) % local.length]!;
  const alt = HERO_ROSTER.filter((h) => h.id !== excludeId);
  return alt[(wave + slot) % alt.length] ?? HERO_ROSTER[0]!;
}
