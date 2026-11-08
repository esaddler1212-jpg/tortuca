import { BATTLEWORLD_ARCS, allHeroArcIds } from '../flight-nemulator/src/battleworld-arcs.ts';
import { DISTRICTS } from '../flight-nemulator/src/districts.ts';
import { HERO_ROSTER } from '../flight-nemulator/src/hero-roster.ts';

const districtIds = new Set(DISTRICTS.map((d) => d.id));

const rosterIds = HERO_ROSTER.map((h) => h.id);
for (const id of rosterIds) {
  if (!BATTLEWORLD_ARCS[id]) {
    console.error(`missing arc for ${id}`);
    process.exit(1);
  }
}

const arcIds = allHeroArcIds();
if (arcIds.length !== rosterIds.length) {
  console.error('arc roster length mismatch');
  process.exit(1);
}

for (const id of Object.keys(BATTLEWORLD_ARCS)) {
  const arc = BATTLEWORLD_ARCS[id]!;
  if (!arc.title || !arc.thread || arc.links.length < 1) {
    console.error(`arc ${id} incomplete`);
    process.exit(1);
  }
  if (!districtIds.has(arc.districtId)) {
    console.error(`arc ${id} unknown district ${arc.districtId}`);
    process.exit(1);
  }
}

console.log(`check-battleworld-arcs: ok (${rosterIds.length} heroes)`);
