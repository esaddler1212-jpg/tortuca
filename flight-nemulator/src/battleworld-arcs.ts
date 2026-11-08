import { HERO_ROSTER } from './hero-roster';
import { pairVillainCodename } from './hero-pair-boss';
import { arcBeatsForHero, hasArcBeat, type ArcBeat } from './arc-progress';
import { HERO_MUTATIONS, type MutationUniverse } from './roster-mutations';

export type ArcContext = {
  role: 'hero' | 'villain';
  wave: number;
  takeoverCount: number;
  pairBossBlocked: boolean;
  playerStones: number;
  stonesSealed: number;
  districtId: string | null;
  lattice: number;
};

export type HeroArcDef = {
  title: string;
  homage: string;
  universe: MutationUniverse;
  thread: string;
  links: string[];
  districtId: string;
  /** Optional beat only this hero cares about */
  signatureBeat?: ArcBeat;
  signatureLabel?: string;
};

const LANTERN_IDS = new Set([
  'emerald-pilot',
  'jade-architect',
  'garnet-brawler',
  'spectrum-artist'
]);

const KI_IDS = new Set([
  'ki-wanderer',
  'ki-prince',
  'ki-sage',
  'time-blade',
  'hybrid-warden',
  'cell-mimic',
  'spirit-buu'
]);

function meta(heroId: string): { homage: string; universe: MutationUniverse } {
  const m = HERO_MUTATIONS[heroId];
  return { homage: m?.mutatesFrom ?? heroId, universe: m?.universe ?? 'original' };
}

function spec(heroId: string) {
  return HERO_ROSTER.find((h) => h.id === heroId);
}

function baseThread(universe: MutationUniverse): string {
  if (universe === 'dbz') return 'Ki Plateau ↔ Mind Stone; Frieza-line raids on Battleworld';
  if (universe === 'dc') return 'Lantern / Gotham / Metro borders on the same ring';
  return 'Stark Nexus ↔ Power Stone; Doom & Thanos hunt the lattice';
}

function buildArc(heroId: string, overrides: Partial<HeroArcDef>): HeroArcDef {
  const { homage, universe } = meta(heroId);
  const h = spec(heroId);
  return {
    title: overrides.title ?? `${homage} arc`,
    homage,
    universe,
    thread: overrides.thread ?? baseThread(universe),
    links: overrides.links ?? [],
    districtId: overrides.districtId ?? h?.districtId ?? 'metropolis',
    signatureBeat: overrides.signatureBeat,
    signatureLabel: overrides.signatureLabel
  };
}

/** Fan-tribute story web — one objective ladder, shared Battleworld lattice. */
export const BATTLEWORLD_ARCS: Record<string, HeroArcDef> = {};

function register(id: string, arc: HeroArcDef): void {
  BATTLEWORLD_ARCS[id] = arc;
}

// --- Dedicated / heavy arcs (mechanics elsewhere) ---
register(
  'solar-apex',
  buildArc('solar-apex', {
    title: 'Last son & rings',
    thread: 'Coast Lantern safe house · yellow fear path · Krypton Eclipse rival',
    links: ['emerald-pilot', 'krypton-eclipse', 'titan-snap-echo'],
    signatureLabel: 'Coast Lantern oath or fear ring'
  })
);
register(
  'latverian-sovereign',
  buildArc('latverian-sovereign', {
    title: 'God Emperor throne',
    thread: 'Timeline hero win or Battleworld villain remake — ties Infinity hunt',
    links: ['tin-aviator', 'doctor-doom', 'trickster-prince'],
    signatureBeat: 'hunt-ascended',
    signatureLabel: 'Throne via stones, annihilate, or remap'
  })
);
register(
  'wall-crawler',
  buildArc('wall-crawler', {
    title: 'Symbiote saga',
    thread: 'Gotham + Venom/Carnage echoes; bond thread crosses Venom Echo',
    links: ['venom-echo', 'carnage-echo', 'goblin-glider'],
    signatureLabel: 'Merge symbiote after beating echo bosses'
  })
);
register(
  'venom-echo',
  buildArc('venom-echo', {
    title: 'Bonded legion',
    thread: 'Villain runway — each hero you drop becomes a loadout',
    links: ['wall-crawler', 'laughing-harlequin'],
    signatureLabel: 'Bond up to eight heroes'
  })
);
register(
  'cell-mimic',
  buildArc('cell-mimic', {
    title: 'Perfect hunt',
    thread: 'Absorb fighters; Ki Plateau tournament energy',
    links: ['ki-wanderer', 'android-phalanx', 'emperor-frieze'],
    signatureLabel: 'Stack six absorptions'
  })
);
register(
  'spirit-buu',
  buildArc('spirit-buu', {
    title: 'Pink catastrophe',
    thread: 'Absorb anyone; territory raze synergizes',
    links: ['hybrid-warden', 'legend-bruiser'],
    signatureLabel: 'Stack absorptions'
  })
);

// Lantern corps
for (const id of ['emerald-pilot', 'jade-architect', 'garnet-brawler', 'spectrum-artist']) {
  register(
    id,
    buildArc(id, {
      title: 'Emerald corps oath',
      thread: 'Coast Lantern · Soul Stone watch · aid Solar Apex finale',
      links: ['solar-apex', 'sine-warden', 'emerald-pilot'],
      districtId: 'coast-city',
      signatureBeat: 'corps-oath',
      signatureLabel: 'Press H at Coast Lantern to swear the corps oath'
    })
  );
}

// Ki squad
for (const id of ['ki-wanderer', 'ki-prince', 'ki-sage', 'time-blade', 'hybrid-warden']) {
  register(
    id,
    buildArc(id, {
      title: 'Tournament circuit',
      thread: 'Mind Stone on Ki Plateau · Emperor Frieze & Cell lines',
      links: ['emperor-frieze', 'void-colossus', 'cell-mimic'],
      districtId: 'ki-plateau',
      signatureBeat: 'squad-clash',
      signatureLabel: 'Press H on Ki Plateau to mark the squad clash'
    })
  );
}

// Stark / tech
register(
  'tin-aviator',
  buildArc('tin-aviator', {
    title: 'Iron oath',
    thread: 'Power Stone at Stark Nexus · pair boss Dr. Doom · vs Titan Snap Echo',
    links: ['latverian-sovereign', 'red-codriver', 'chrome-overmind'],
    districtId: 'stark-nexus',
    signatureLabel: 'Hold Stark Nexus while Thanos hunts stones'
  })
);
register(
  'red-codriver',
  buildArc('red-codriver', {
    title: 'Siege wing',
    thread: 'Backs Iron trial · Brute Abom pair rival',
    links: ['tin-aviator', 'brute-abom', 'gamma-titan'],
    districtId: 'stark-nexus'
  })
);
register(
  'chrome-sage',
  buildArc('chrome-sage', {
    title: 'Density gambit',
    thread: 'Ultron stone hunter · Magnet Warden feud',
    links: ['chrome-overmind', 'magnet-warden', 'tin-aviator'],
    districtId: 'wakanda-gateway'
  })
);

// Gotham / street
register(
  'shade-knight',
  buildArc('shade-knight', {
    title: 'Knightfall patrol',
    thread: 'Gotham henchmen arcs · Joker / Harley pair',
    links: ['laughing-harlequin', 'night-gargoyle', 'deathstroke-arc'],
    districtId: 'gotham-nights'
  })
);

// Metro / flying bricks
register(
  'storm-hammer',
  buildArc('storm-hammer', {
    title: 'Storm front',
    thread: 'Asgard Embassy · Trickster Prince stone hunter',
    links: ['trickster-prince', 'black-adam-echo', 'cataclysm-deity'],
    districtId: 'asgard-embassy'
  })
);
register(
  'amazon-vanguard',
  buildArc('amazon-vanguard', {
    title: 'Themyscira stand',
    thread: 'Wakanda borders · Titan Snap rivalry',
    links: ['titan-snap-echo', 'omega-tyrant'],
    districtId: 'wakanda-gateway'
  })
);
register(
  'gamma-titan',
  buildArc('gamma-titan', {
    title: 'Rage meter',
    thread: 'Sokovia memorial siege · Brute Abom echoes',
    links: ['brute-abom', 'doomsday-echo'],
    districtId: 'sokovia-memorial'
  })
);

// Speed / cosmic / misc — compact defaults
const DEFAULT_LINKS: Record<string, string[]> = {
  'martian-strider': ['trickster-prince', 'brain-colossus'],
  'velocity-streak': ['mirror-streak', 'android-phalanx'],
  'comet-surfer': ['harbinger-titan', 'titan-snap-echo'],
  'nova-centurion': ['harbinger-titan', 'titan-snap-echo'],
  'solar-envoy': ['solar-apex', 'bizarro-eclipse'],
  'flame-jet': ['goblin-glider', 'tin-aviator'],
  'wing-captain': ['tin-aviator', 'red-codriver'],
  'thunder-zealot': ['black-adam-echo', 'storm-hammer'],
  'storm-caller': ['cinder-phoenix', 'magnet-warden'],
  'sorcerer-apex': ['cinder-phoenix', 'time-blade'],
  'sky-tyrant': ['night-gargoyle', 'omega-tyrant'],
  'phoenix-ember': ['cinder-phoenix', 'magnet-warden', 'storm-caller'],
  'wing-archon': ['sky-tyrant', 'shade-knight'],
  'golden-sentry': ['void-colossus', 'harbinger-titan'],
  'magnet-sovereign': ['magnet-warden', 'chrome-sage']
};

for (const h of HERO_ROSTER) {
  if (BATTLEWORLD_ARCS[h.id]) continue;
  register(
    h.id,
    buildArc(h.id, {
      links: DEFAULT_LINKS[h.id] ?? ['titan-snap-echo', 'latverian-sovereign']
    })
  );
}

export function allHeroArcIds(): string[] {
  return HERO_ROSTER.map((h) => h.id);
}

export function latticeHudLine(lattice: number): string {
  return `Battleworld lattice ${lattice} — arcs link when you clear takeovers, stones, and pair rivals`;
}

export function characterArcHudLine(heroId: string, ctx: ArcContext): string | null {
  const arc = BATTLEWORLD_ARCS[heroId];
  if (!arc) return null;
  const beats = arcBeatsForHero(heroId);
  const rival = pairVillainCodename(heroId);

  if (ctx.role === 'hero' && ctx.takeoverCount > 0) {
    return `${arc.title}: reclaim ${ctx.takeoverCount} takeover district${ctx.takeoverCount === 1 ? '' : 's'} — ${arc.thread}`;
  }
  if (ctx.pairBossBlocked && ctx.role === 'hero') {
    return `${arc.title}: finish territory & God Emperor stone hunt before facing ${rival}`;
  }
  if (!beats.has('stone-linked') && ctx.role === 'hero' && ctx.stonesSealed < 3) {
    return `${arc.title}: seal Infinity Stones (H) — ${arc.signatureLabel ?? arc.thread}`;
  }
  if (!beats.has('stone-linked') && ctx.role === 'villain' && ctx.playerStones < 6) {
    return `${arc.title}: race Thanos/Loki/Ultron for stones (${ctx.playerStones}/6)`;
  }
  if (!beats.has('pair-down')) {
    return `${arc.title}: wave-10 pair duel vs ${rival} — linked to ${arc.links.slice(0, 2).join(', ')}`;
  }
  if (arc.signatureBeat && arc.signatureLabel && !beats.has(arc.signatureBeat)) {
    return `${arc.title}: ${arc.signatureLabel}`;
  }
  if (!beats.has('world-saved') && ctx.role === 'hero') {
    return `${arc.title}: arc thread cleared — hold ${arc.homage} integrity above 52% to raise a monument`;
  }
  return `${arc.title} complete on Battleworld · lattice +1 (${ctx.lattice})`;
}

export function tryArcDistrictInteract(
  heroId: string,
  districtId: string | null
): { beat: ArcBeat; line: string } | null {
  if (!districtId) return null;
  if (LANTERN_IDS.has(heroId) && districtId === 'coast-city' && !hasArcBeat(heroId, 'corps-oath')) {
    return {
      beat: 'corps-oath',
      line: 'Emerald corps oath sworn — Solar Apex finale link strengthened'
    };
  }
  if (KI_IDS.has(heroId) && districtId === 'ki-plateau' && !hasArcBeat(heroId, 'squad-clash')) {
    return {
      beat: 'squad-clash',
      line: 'Ki squad clash marked — Mind Stone hunters know your power'
    };
  }
  if (
    (heroId === 'tin-aviator' || heroId === 'red-codriver') &&
    districtId === 'stark-nexus' &&
    !hasArcBeat(heroId, 'stone-linked')
  ) {
    return {
      beat: 'stone-linked',
      line: 'Stark Nexus lattice — Power Stone board linked to Iron trial'
    };
  }
  return null;
}
