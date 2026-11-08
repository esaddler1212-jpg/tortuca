/**
 * Prints flight-sandbox aerial audit (Marvel/DC heroes + villains; DBZ listed separately).
 */
import { AERIAL_LABELS, type AerialMobility } from '../flight-nemulator/src/aerial-mobility.ts';
import { HERO_ROSTER } from '../flight-nemulator/src/hero-roster.ts';
import { VILLAIN_CLONES } from '../flight-nemulator/src/villain-roster.ts';

const DBZ_HERO = new Set(['ki-wanderer', 'ki-prince']);

function printRow(name: string, mode: AerialMobility, note: string): void {
  console.log(`  ${name.padEnd(22)} ${AERIAL_LABELS[mode].padEnd(22)} ${note}`);
}

const marvelDcHeroes = HERO_ROSTER.filter((h) => !DBZ_HERO.has(h.id));
const dbzHeroes = HERO_ROSTER.filter((h) => DBZ_HERO.has(h.id));
const dbzVillains = VILLAIN_CLONES.filter((v) => v.universe === 'dbz');
const marvelDcVillains = VILLAIN_CLONES.filter((v) => v.universe !== 'dbz');

console.log('\n=== Playable heroes (Marvel / DC homages) ===\n');
for (const h of marvelDcHeroes) printRow(h.codename, h.aerial, h.tagline);

console.log('\n=== Playable heroes (DBZ — ki flight) ===\n');
for (const h of dbzHeroes) printRow(h.codename, h.aerial, h.tagline);

console.log('\n=== Villain clones (Marvel / DC) ===\n');
for (const v of marvelDcVillains) printRow(v.codename, v.aerial, v.tagline);

console.log('\n=== Villain clones (DBZ) ===\n');
for (const v of dbzVillains) printRow(v.codename, v.aerial, v.tagline);

const innate = new Set<AerialMobility>(['native', 'tech', 'ring', 'ki', 'magnet']);
const assisted = new Set<AerialMobility>(['jetpack', 'glide', 'web-swing']);

const heroInnate = marvelDcHeroes.filter((h) => innate.has(h.aerial)).length;
const villainInnate = marvelDcVillains.filter((v) => innate.has(v.aerial)).length;

console.log('\n=== Coverage ===');
console.log(
  `  Marvel/DC heroes with innate/tech flight: ${heroInnate}/${marvelDcHeroes.length} (${Math.round((heroInnate / marvelDcHeroes.length) * 100)}%)`
);
console.log(
  `  Marvel/DC villains with innate/tech/magnet: ${villainInnate}/${marvelDcVillains.length} (${Math.round((villainInnate / marvelDcVillains.length) * 100)}%)`
);
console.log(
  `  Assisted (jetpack/glide/web): heroes ${marvelDcHeroes.filter((h) => assisted.has(h.aerial)).length}, villains ${marvelDcVillains.filter((v) => assisted.has(v.aerial)).length}`
);

const missingAerial = [
  ...HERO_ROSTER.filter((h) => !h.aerial),
  ...VILLAIN_CLONES.filter((v) => !v.aerial)
];
if (missingAerial.length > 0) {
  console.error('audit-aerial-roster: missing aerial field');
  process.exit(1);
}

console.log('\naudit-aerial-roster: ok\n');
