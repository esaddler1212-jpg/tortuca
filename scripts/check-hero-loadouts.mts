import { listHeroLoadouts } from '../flight-nemulator/src/hero-customization.ts';
import { getHero } from '../flight-nemulator/src/hero-roster.ts';

const rules: { id: string; minSuits: number; minAbilitiesPerSuit: number }[] = [
  { id: 'tin-aviator', minSuits: 8, minAbilitiesPerSuit: 2 },
  { id: 'red-codriver', minSuits: 7, minAbilitiesPerSuit: 2 },
  { id: 'shade-knight', minSuits: 8, minAbilitiesPerSuit: 2 }
];

for (const { id, minSuits, minAbilitiesPerSuit } of rules) {
  const spec = getHero(id);
  if (!spec) {
    console.error(`missing hero ${id}`);
    process.exit(1);
  }
  const suits = listHeroLoadouts(spec);
  if (suits.length < minSuits) {
    console.error(`${id}: expected >= ${minSuits} suit loadouts, got ${suits.length}`);
    process.exit(1);
  }
  if (spec.suitVariants && spec.suitVariants.length > 0) {
    console.error(`${id}: use forms[] for suit+ability bundles, not suitVariants`);
    process.exit(1);
  }
  const thin = suits.find((k) => k.abilities.length < minAbilitiesPerSuit);
  if (thin) {
    console.error(`${id}: suit "${thin.label}" needs >= ${minAbilitiesPerSuit} abilities`);
    process.exit(1);
  }
  const missingRole = suits.find((k) => !k.suitRole);
  if (missingRole) {
    console.error(`${id}: suit "${missingRole.label}" missing suitRole`);
    process.exit(1);
  }
  console.log(`${spec.codename}: ${suits.length} suits (abilities + roles)`);
}

console.log('check-hero-loadouts: ok');
