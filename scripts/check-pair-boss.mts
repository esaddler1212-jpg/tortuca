import {
  PAIR_BOSS_WAVE,
  PAIR_VILLAIN_PINNED,
  pairVillainCodename,
  pairVillainForHero
} from '../flight-nemulator/src/hero-pair-boss.ts';
import { isVillainOnlyHero } from '../flight-nemulator/src/hero-alignment.ts';
import { HERO_ROSTER } from '../flight-nemulator/src/hero-roster.ts';
import { VILLAIN_CLONES } from '../flight-nemulator/src/villain-roster.ts';

if (PAIR_BOSS_WAVE < 8) {
  console.error('PAIR_BOSS_WAVE should be >= 8');
  process.exit(1);
}

for (const id of Object.keys(PAIR_VILLAIN_PINNED)) {
  if (!HERO_ROSTER.some((h) => h.id === id)) {
    console.error(`pinned pair hero missing from roster: ${id}`);
    process.exit(1);
  }
}

let pinnedLogged = 0;
let rivalLogged = 0;
let exempt = 0;

for (const hero of HERO_ROSTER) {
  if (isVillainOnlyHero(hero.id)) {
    exempt++;
    continue;
  }

  const pair = pairVillainForHero(hero.id);
  const pinned = PAIR_VILLAIN_PINNED[hero.id];

  if (pinned) {
    if (pair.id !== pinned) {
      console.error(`${hero.codename}: expected pinned boss ${pinned}, got ${pair.id}`);
      process.exit(1);
    }
    if (!pair.rivalHeroIds.includes(hero.id)) {
      console.error(`${hero.codename}: pinned boss ${pair.codename} does not list hero as rival`);
      process.exit(1);
    }
    console.log(`${hero.codename} vs ${pair.codename} (pinned)`);
    pinnedLogged++;
    continue;
  }

  const rivals = VILLAIN_CLONES.filter((v) => v.rivalHeroIds.includes(hero.id));
  if (rivals.length === 0) {
    console.error(`${hero.codename}: no villain lists hero in rivalHeroIds`);
    process.exit(1);
  }
  if (!pair.rivalHeroIds.includes(hero.id)) {
    console.error(
      `${hero.codename}: pair boss ${pair.codename} is not a rival match (fallback broken)`
    );
    process.exit(1);
  }
  console.log(`${hero.codename} vs ${pairVillainCodename(hero.id)} (rival roster)`);
  rivalLogged++;
}

console.log(
  `check-pair-boss: ok (${pinnedLogged} pinned, ${rivalLogged} rival-fallback, ${exempt} villain-only exempt)`
);
