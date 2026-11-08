/**
 * Prints flight-sandbox aerial audit + full mutation map.
 */
import { AERIAL_LABELS, type AerialMobility } from '../flight-nemulator/src/aerial-mobility.ts';
import { HERO_ROSTER } from '../flight-nemulator/src/hero-roster.ts';
import { VILLAIN_CLONES } from '../flight-nemulator/src/villain-roster.ts';
import { HERO_MUTATIONS, VILLAIN_MUTATIONS } from '../flight-nemulator/src/roster-mutations.ts';

function printRow(name: string, mode: AerialMobility, note: string): void {
  console.log(`  ${name.padEnd(22)} ${AERIAL_LABELS[mode].padEnd(22)} ${note}`);
}

function printMutationRow(codename: string, mutatesFrom: string, uni: string, aerial: string): void {
  console.log(`  ${codename.padEnd(22)} → ${mutatesFrom.padEnd(36)} [${uni}] ${aerial}`);
}

const dbzHeroes = HERO_ROSTER.filter((h) => HERO_MUTATIONS[h.id]?.universe === 'dbz');
const marvelDcHeroes = HERO_ROSTER.filter((h) => HERO_MUTATIONS[h.id]?.universe !== 'dbz');
const dbzVillains = VILLAIN_CLONES.filter((v) => v.universe === 'dbz');
const marvelDcVillains = VILLAIN_CLONES.filter((v) => v.universe !== 'dbz');

console.log('\n=== Full roster — who they mutate from (playable heroes) ===\n');
for (const h of HERO_ROSTER) {
  const m = HERO_MUTATIONS[h.id];
  if (!m) {
    console.error(`missing HERO_MUTATIONS[${h.id}]`);
    process.exit(1);
  }
  printMutationRow(h.codename, m.mutatesFrom, m.universe.toUpperCase(), AERIAL_LABELS[h.aerial]);
}

console.log('\n=== Full roster — who they mutate from (villain clones) ===\n');
for (const v of VILLAIN_CLONES) {
  const m = VILLAIN_MUTATIONS[v.id];
  if (!m) {
    console.error(`missing VILLAIN_MUTATIONS[${v.id}]`);
    process.exit(1);
  }
  const rivals = v.rivalHeroIds
    .map((id) => HERO_ROSTER.find((h) => h.id === id)?.codename ?? id)
    .join(', ');
  console.log(
    `  ${v.codename.padEnd(22)} → ${m.mutatesFrom.padEnd(36)} [${m.universe.toUpperCase()}] rivals: ${rivals}`
  );
}

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
console.log(`  Heroes total: ${HERO_ROSTER.length} | Villain clones: ${VILLAIN_CLONES.length}`);
console.log(
  `  Marvel/DC heroes with innate/tech flight: ${heroInnate}/${marvelDcHeroes.length} (${Math.round((heroInnate / marvelDcHeroes.length) * 100)}%)`
);
console.log(
  `  Marvel/DC villains with innate/tech/magnet/ring: ${villainInnate}/${marvelDcVillains.length} (${Math.round((villainInnate / marvelDcVillains.length) * 100)}%)`
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
