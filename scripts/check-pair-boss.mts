import { PAIR_BOSS_WAVE, pairVillainForHero } from '../flight-nemulator/src/hero-pair-boss.ts';
import { getHero } from '../flight-nemulator/src/hero-roster.ts';

if (PAIR_BOSS_WAVE < 8) {
  console.error('PAIR_BOSS_WAVE should be >= 8');
  process.exit(1);
}

for (const id of ['tin-aviator', 'red-codriver', 'shade-knight', 'solar-apex', 'latverian-sovereign']) {
  const hero = getHero(id);
  if (!hero) continue;
  const pair = pairVillainForHero(id);
  if (!pair.rivalHeroIds.includes(id)) {
    console.error(`${id}: pair boss ${pair.id} does not list hero as rival`);
    process.exit(1);
  }
  console.log(`${hero.codename} vs ${pair.codename}`);
}

console.log('check-pair-boss: ok');
