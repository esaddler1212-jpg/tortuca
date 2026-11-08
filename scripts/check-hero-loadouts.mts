import { listHeroLoadouts } from '../flight-nemulator/src/hero-customization.ts';
import { getHero } from '../flight-nemulator/src/hero-roster.ts';

const rules: { id: string; minKits: number; minAbilitiesPerKit: number }[] = [
  { id: 'tin-aviator', minKits: 6, minAbilitiesPerKit: 2 },
  { id: 'red-codriver', minKits: 6, minAbilitiesPerKit: 2 },
  { id: 'shade-knight', minKits: 7, minAbilitiesPerKit: 2 }
];

for (const { id, minKits, minAbilitiesPerKit } of rules) {
  const spec = getHero(id);
  if (!spec) {
    console.error(`missing hero ${id}`);
    process.exit(1);
  }
  const kits = listHeroLoadouts(spec);
  if (kits.length < minKits) {
    console.error(`${id}: expected >= ${minKits} ability kits, got ${kits.length}`);
    process.exit(1);
  }
  if (spec.suitVariants && spec.suitVariants.length > 0) {
    console.error(`${id}: cosmetic suitVariants should be empty — use ability kits in forms`);
    process.exit(1);
  }
  const thin = kits.find((k) => k.abilities.length < minAbilitiesPerKit);
  if (thin) {
    console.error(`${id}: kit "${thin.label}" needs >= ${minAbilitiesPerKit} abilities`);
    process.exit(1);
  }
  console.log(`${spec.codename}: ${kits.length} ability kits`);
}

console.log('check-hero-loadouts: ok');
