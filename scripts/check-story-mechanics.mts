import { getHero } from '../flight-nemulator/src/hero-roster.ts';
import { DUAL_ROLE_HERO_ID, isVillainOnlyHero } from '../flight-nemulator/src/hero-alignment.ts';
import { ABSORBER_HERO_IDS } from '../flight-nemulator/src/hero-absorption.ts';
import { getVillainClone } from '../flight-nemulator/src/villain-roster.ts';

const solar = getHero('solar-apex');
if (!solar?.forms.some((f) => f.id === 'green-ring' && f.kitPrimary === 'ring')) {
  console.error('solar-apex missing green ring form');
  process.exit(1);
}
if (!solar.forms.some((f) => f.id === 'yellow-ring')) {
  console.error('solar-apex missing yellow ring form');
  process.exit(1);
}

if (!getHero(DUAL_ROLE_HERO_ID)) {
  console.error('missing playable Latverian Sovereign');
  process.exit(1);
}

for (const id of ABSORBER_HERO_IDS) {
  if (!isVillainOnlyHero(id) || !getHero(id)) {
    console.error(`absorber ${id} misconfigured`);
    process.exit(1);
  }
}

if (!getVillainClone('carnage-echo')) {
  console.error('missing carnage-echo villain');
  process.exit(1);
}

const venomPlay = getHero('venom-echo');
if (!venomPlay?.forms.some((f) => f.id === 'venom-base')) {
  console.error('missing playable venom-echo');
  process.exit(1);
}

console.log('check-story-mechanics: ok');
