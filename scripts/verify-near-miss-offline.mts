/**
 * Pure near-miss invariants (OpenGame verify-offline style, CN-OG-05 slice).
 */
import {
  NEAR_MISS_CHAIN_MAX,
  NEAR_MISS_MIN_MPH,
  createNearMissState,
  scanNearMiss
} from '../drive-world/src/near-miss-boost.ts';

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const band = 4.8;
const one = scanNearMiss(0, 0, NEAR_MISS_MIN_MPH + 8, [{ x: band, z: 0, key: 't' }], createNearMissState(), 0, 0.016);
ok('single near-miss fires', Boolean(one.event));
ok('nitro gain positive', (one.event?.nitroGain ?? 0) > 0.05);

let state = createNearMissState();
let maxChain = 0;
for (let i = 0; i < 15; i++) {
  const r = scanNearMiss(0, 0, 50, [{ x: 4.2 + i * 0.02, z: 0, key: `k${i}` }], state, i * 4, 0.02);
  state = r.state;
  if (r.event) maxChain = r.event.chain;
}
ok('chain capped', maxChain === NEAR_MISS_CHAIN_MAX);

if (failed) process.exit(1);
console.log('verify-near-miss-offline: ok');