import { createTerritoryState, canHeroFacePairBoss, DEFENDER_PRESSURE_USD } from '../flight-nemulator/src/territory-invasion.ts';
import { districtIdAtPosition } from '../flight-nemulator/src/build-city.ts';

const state = createTerritoryState();
if (!canHeroFacePairBoss(state)) {
  console.error('empty territory should allow pair boss');
  process.exit(1);
}
if (DEFENDER_PRESSURE_USD < 10_000) {
  console.error('DEFENDER_PRESSURE_USD too low');
  process.exit(1);
}
const id = districtIdAtPosition(0, 0);
if (typeof id !== 'string' && id !== null) {
  console.error('districtIdAtPosition invalid');
  process.exit(1);
}

console.log('check-territory-invasion: ok');
