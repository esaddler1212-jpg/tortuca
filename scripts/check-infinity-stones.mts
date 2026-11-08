import { HUNTER_PICKS, INFINITY_STONE_TOTAL } from '../flight-nemulator/src/infinity-stones-arc.ts';

if (INFINITY_STONE_TOTAL !== 6) {
  console.error('expected 6 infinity stones');
  process.exit(1);
}

const hunters = ['titan-snap-echo', 'trickster-prince', 'chrome-overmind'];
for (const id of hunters) {
  if (!(HUNTER_PICKS as readonly string[]).includes(id)) {
    console.error(`missing hunter ${id}`);
    process.exit(1);
  }
}

console.log('check-infinity-stones: ok');
