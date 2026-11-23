import { isVillainOnlyHero } from '../flight-nemulator/src/hero-alignment.ts';
import { primaryVillainIdForHero } from '../flight-nemulator/src/roster-expansion.ts';
import { getVillainClone } from '../flight-nemulator/src/villain-roster.ts';
import { PAIR_VILLAIN_PINNED, pairVillainForHero } from '../flight-nemulator/src/hero-pair-boss.ts';
import { HERO_ROSTER } from '../flight-nemulator/src/hero-roster.ts';
import { VILLAIN_CLONES } from '../flight-nemulator/src/villain-roster.ts';

const heroIds = HERO_ROSTER.map((h) => h.id);
const villainIds = new Set(VILLAIN_CLONES.map((v) => v.id));

for (const v of VILLAIN_CLONES) {
  if (!v.primaryRivalHeroId) {
    console.error(`villain ${v.codename}: missing primaryRivalHeroId`);
    process.exit(1);
  }
  if (!v.rivalHeroIds.includes(v.primaryRivalHeroId)) {
    console.error(`villain ${v.codename}: primary not in rivalHeroIds`);
    process.exit(1);
  }
  if (!heroIds.includes(v.primaryRivalHeroId)) {
    console.error(`villain ${v.codename}: primary hero ${v.primaryRivalHeroId} missing from roster`);
    process.exit(1);
  }
}

const primaryCount = new Map<string, number>();
for (const v of VILLAIN_CLONES) {
  const h = v.primaryRivalHeroId!;
  primaryCount.set(h, (primaryCount.get(h) ?? 0) + 1);
}

for (const hero of HERO_ROSTER) {
  if (isVillainOnlyHero(hero.id)) continue;
  if (PAIR_VILLAIN_PINNED[hero.id]) {
    const boss = pairVillainForHero(hero.id);
    if (boss.id !== PAIR_VILLAIN_PINNED[hero.id]) {
      console.error(`${hero.codename}: pinned boss mismatch`);
      process.exit(1);
    }
    continue;
  }
  const villainId = primaryVillainIdForHero(hero.id);
  if (!villainId) {
    console.error(`${hero.codename}: no scripted primary villain id`);
    process.exit(1);
  }
  const boss = getVillainClone(villainId);
  if (!boss) {
    console.error(`${hero.codename}: missing villain clone ${villainId}`);
    process.exit(1);
  }
  if (boss.primaryRivalHeroId !== hero.id) {
    console.error(
      `${hero.codename}: villain ${boss.codename} primaryRivalHeroId=${boss.primaryRivalHeroId}, expected ${hero.id}`
    );
    process.exit(1);
  }
  if (!boss.rivalHeroIds.includes(hero.id)) {
    console.error(`${hero.codename}: nemesis ${boss.codename} missing hero in rivalHeroIds`);
    process.exit(1);
  }
  const pairBoss = pairVillainForHero(hero.id);
  if (pairBoss.id !== boss.id) {
    console.error(`${hero.codename}: pairVillainForHero ${pairBoss.codename} != scripted ${boss.codename}`);
    process.exit(1);
  }
  if ((primaryCount.get(hero.id) ?? 0) < 1) {
    console.error(`${hero.codename}: no villain claims primary rivalry`);
    process.exit(1);
  }
}

for (const v of VILLAIN_CLONES) {
  const dup = VILLAIN_CLONES.filter((x) => x.primaryRivalHeroId === v.primaryRivalHeroId);
  if (dup.length > 1) {
    console.error(
      `hero ${v.primaryRivalHeroId}: multiple primaries (${dup.map((x) => x.codename).join(', ')})`
    );
    process.exit(1);
  }
}

if (!villainIds.has('deceit-winger') || !villainIds.has('megaton-forge')) {
  console.error('cyber slice villains missing');
  process.exit(1);
}

console.log(
  `check-hero-villain-parity: ok (${heroIds.length} heroes, ${VILLAIN_CLONES.length} villains, 1:1 primary)`
);
