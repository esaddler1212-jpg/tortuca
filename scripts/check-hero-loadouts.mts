import { listHeroLoadouts } from '../flight-nemulator/src/hero-customization.ts';
import { getHero } from '../flight-nemulator/src/hero-roster.ts';

const rules: { id: string; min: number }[] = [
  { id: 'tin-aviator', min: 14 },
  { id: 'red-codriver', min: 10 },
  { id: 'shade-knight', min: 12 }
];

for (const { id, min } of rules) {
  const spec = getHero(id);
  if (!spec) {
    console.error(`missing hero ${id}`);
    process.exit(1);
  }
  const n = listHeroLoadouts(spec).length;
  if (n < min) {
    console.error(`${id}: expected >= ${min} loadouts, got ${n}`);
    process.exit(1);
  }
  console.log(`${spec.codename}: ${n} loadouts`);
}

console.log('check-hero-loadouts: ok');
