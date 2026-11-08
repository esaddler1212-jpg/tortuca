import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const handler = readFileSync(
  path.join(root, 'netlify/functions/flight-nemulator-lattice.ts'),
  'utf8'
);
if (!/getValidSession/.test(handler)) {
  console.error('flight-nemulator-lattice: missing getValidSession');
  process.exit(1);
}

const glb = path.join(root, 'flight-nemulator/public/models/heroes/tin-aviator.glb');
const st = statSync(glb);
if (st.size < 200) {
  console.error('tin-aviator.glb missing or too small — run npm run build:hero-glb');
  process.exit(1);
}

const cloud = readFileSync(
  path.join(root, 'flight-nemulator/src/battleworld-lattice-cloud.ts'),
  'utf8'
);
if (!/latticeFetchHeaders|latticeRequestHeaders/.test(cloud)) {
  console.error('battleworld-lattice-cloud: missing auth headers');
  process.exit(1);
}

if (!/mergeLatticeFromCloud/.test(cloud)) {
  console.error('battleworld-lattice-cloud: missing merge on pull');
  process.exit(1);
}

console.log('check-battleworld-lattice: ok');
