/**
 * Battleworld roster expansion — backlog heroes/villains (homage codenames only).
 * 1:1 primary nemesis pairs via `primaryRivalHeroId` on villains.
 */
import type { AerialMobility } from './aerial-mobility';
import type { HeroSpec, PowerKind } from './hero-roster';
export type ExpansionVillainUniverse = 'dbz' | 'marvel' | 'dc' | 'indie' | 'cyber' | 'golden';

type MutationUniverse =
  | 'marvel'
  | 'dc'
  | 'dbz'
  | 'original'
  | 'indie'
  | 'cyber'
  | 'golden';

export type ExpansionVillainSpec = {
  id: string;
  codename: string;
  tagline: string;
  universe: ExpansionVillainUniverse;
  aerial: AerialMobility;
  primaryRivalHeroId: string;
  rivalHeroIds: string[];
  color: [number, number, number];
  hpMul: number;
  speedMul: number;
  siegeMul: number;
  scale: [number, number, number];
};

type CompactHero = {
  id: string;
  codename: string;
  tagline: string;
  districtId: string;
  homeLabel: string;
  power: PowerKind;
  aerial: AerialMobility;
  color: [number, number, number];
  cruise?: number;
  boost?: number;
};

type CompactVillain = {
  id: string;
  codename: string;
  tagline: string;
  universe: ExpansionVillainUniverse;
  aerial: AerialMobility;
  primaryRivalHeroId: string;
  extraRivals?: string[];
  color: [number, number, number];
};

/** Canonical 1:1 nemesis pairs (expansion heroes → villain id). */
export const EXPANSION_NEMESIS_PAIRS: [string, string][] = [
  ['cosmic-envoy', 'annihilus-gate'],
  ['starbound-outlaw', 'lex-frame'],
  ['monarch-sting', 'iron-sentinel'],
  ['ikaris-prime', 'dark-saiyan-jackal'],
  ['adam-halo', 'red-monarch'],
  ['subsurface-sovereign', 'angel-attendant'],
  ['magnetic-ace', 'cell-mimic'],
  ['sunspot-flare', 'livewire-surge'],
  ['rogue-paragon', 'parasite-leech'],
  ['nth-wing', 'vulture-scavenger'],
  ['scarab-pilot', 'nano-swarm-queen'],
  ['power-echo', 'bizarro-eclipse'],
  ['booster-chancellor', 'trickster-prince'],
  ['captain-atom-core', 'sound-barrage'],
  ['new-god-vanguard', 'omega-tyrant'],
  ['raven-shade', 'carnage-echo'],
  ['ki-maiden', 'android-phalanx'],
  ['pan-spark', 'ledger-brute'],
  ['undefeated-youth', 'throne-viltrum'],
  ['atom-eve-architect', 'battle-brute'],
  ['tech-jacket-host', 'orbit-lancer'],
  ['bullet-ascender', 'deathstroke-arc'],
  ['air-mote', 'thermal-wisp'],
  ['moth-signal', 'sauron-gaze'],
  ['condor-warden', 'rook-phantom'],
  ['chrome-convoy', 'megaton-forge'],
  ['crimson-ace', 'deceit-winger'],
  ['nitro-phantom', 'bone-shredder'],
  ['patriot-apex', 'krypton-eclipse'],
  ['spectrum-ranger', 'freq-hijacker']
];

/** Legacy roster heroes → canonical primary villain (pre-expansion). */
export const CORE_HERO_NEMESIS: [string, string][] = [
  ['solar-apex', 'krypton-eclipse'],
  ['emerald-pilot', 'chrome-overmind'],
  ['red-cyclone', 'turles-jackal'],
  ['jade-architect', 'ocean-usurper'],
  ['garnet-brawler', 'sine-warden'],
  ['spectrum-artist', 'bleez-rage'],
  ['tin-aviator', 'iron-monger-echo'],
  ['red-codriver', 'legend-bruiser'],
  ['chrome-sage', 'steel-wraith'],
  ['storm-hammer', 'cataclysm-deity'],
  ['wall-crawler', 'venom-echo'],
  ['shade-knight', 'laughing-harlequin'],
  ['martian-strider', 'brain-colossus'],
  ['amazon-vanguard', 'doomsday-echo'],
  ['velocity-streak', 'mirror-streak'],
  ['comet-surfer', 'harbinger-titan'],
  ['nova-centurion', 'void-colossus'],
  ['solar-envoy', 'silver-regent'],
  ['gamma-titan', 'brute-abom'],
  ['flame-jet', 'raider-corsair'],
  ['wing-captain', 'goblin-glider'],
  ['thunder-zealot', 'black-adam-echo'],
  ['storm-caller', 'cinder-phoenix'],
  ['sorcerer-apex', 'magus-mirror'],
  ['sky-tyrant', 'stratos-raider'],
  ['phoenix-ember', 'spirit-buu'],
  ['wing-archon', 'night-gargoyle'],
  ['golden-sentry', 'azure-patriarch'],
  ['magnet-sovereign', 'magnet-warden'],
  ['frost-monarch', 'cryo-stalker'],
  ['cable-echo', 'nimrod-sentinel'],
  ['banshee-wail', 'sabretooth-echo'],
  ['latverian-sovereign', 'doctor-doom'],
  ['ki-wanderer', 'emperor-frieze'],
  ['ki-prince', 'ember-dragon'],
  ['ki-sage', 'omega-android'],
  ['time-blade', 'goku-shade'],
  ['hybrid-warden', 'parasite-infant']
];

const HERO_DEFS: CompactHero[] = [
  {
    id: 'cosmic-envoy',
    codename: 'Cosmic Envoy',
    tagline: 'Binary flare cruise',
    districtId: 'cosmic-dock',
    homeLabel: 'Orbital conduit',
    power: 'beam',
    aerial: 'native',
    color: [0.92, 0.55, 0.18],
    cruise: 520,
    boost: 3200
  },
  {
    id: 'starbound-outlaw',
    codename: 'Starbound Outlaw',
    tagline: 'Jet boots and blasters',
    districtId: 'nova-station',
    homeLabel: 'Ranger berth',
    power: 'beam',
    aerial: 'tech',
    color: [0.72, 0.22, 0.45]
  },
  {
    id: 'monarch-sting',
    codename: 'Monarch Sting',
    tagline: 'Winged micro striker',
    districtId: 'wakanda-gateway',
    homeLabel: 'Hive Annex',
    power: 'beam',
    aerial: 'native',
    color: [0.85, 0.25, 0.62]
  },
  {
    id: 'ikaris-prime',
    codename: 'Ikaris Prime',
    tagline: 'Celestial laser diver',
    districtId: 'watchtower-annex',
    homeLabel: 'Orrery perch',
    power: 'optic',
    aerial: 'native',
    color: [0.25, 0.55, 0.95]
  },
  {
    id: 'adam-halo',
    codename: 'Adam Halo',
    tagline: 'Soul-gem hover',
    districtId: 'asgard-embassy',
    homeLabel: 'Pod cradle',
    power: 'telekinesis',
    aerial: 'native',
    color: [0.78, 0.82, 0.42]
  },
  {
    id: 'subsurface-sovereign',
    codename: 'Subsurface Sovereign',
    tagline: 'Amphibious king hover',
    districtId: 'coast-city',
    homeLabel: 'Tidal crown',
    power: 'thunder',
    aerial: 'native',
    color: [0.12, 0.48, 0.72]
  },
  {
    id: 'magnetic-ace',
    codename: 'Magnetic Ace',
    tagline: 'Speed stutter blur',
    districtId: 'sokovia-memorial',
    homeLabel: 'Magnet rail',
    power: 'telekinesis',
    aerial: 'native',
    color: [0.55, 0.72, 0.92]
  },
  {
    id: 'sunspot-flare',
    codename: 'Sunspot Flare',
    tagline: 'Solar charge flight',
    districtId: 'wakanda-gateway',
    homeLabel: 'Reactor garden',
    power: 'beam',
    aerial: 'native',
    color: [0.95, 0.75, 0.12]
  },
  {
    id: 'rogue-paragon',
    codename: 'Rogue Paragon',
    tagline: 'Borrowed-flight glide',
    districtId: 'watchtower-annex',
    homeLabel: 'Annex loft',
    power: 'telekinesis',
    aerial: 'glide',
    color: [0.92, 0.35, 0.25]
  },
  {
    id: 'nth-wing',
    codename: 'Nth Wing',
    tagline: 'Nth-metal mace diver',
    districtId: 'watchtower-annex',
    homeLabel: 'Spire nest',
    power: 'thunder',
    aerial: 'native',
    color: [0.82, 0.55, 0.22]
  },
  {
    id: 'power-echo',
    codename: 'Power Echo',
    tagline: 'Angrier Kryptonian lane',
    districtId: 'metropolis',
    homeLabel: 'Annex spire',
    power: 'beam',
    aerial: 'native',
    color: [0.95, 0.82, 0.55]
  },
  {
    id: 'scarab-pilot',
    codename: 'Scarab Pilot',
    tagline: 'Living armor wings',
    districtId: 'stark-nexus',
    homeLabel: 'Scarab lab',
    power: 'repulsor',
    aerial: 'tech',
    color: [0.15, 0.65, 0.55]
  },
  {
    id: 'booster-chancellor',
    codename: 'Booster Chancellor',
    tagline: 'Time-ring boots',
    districtId: 'cosmic-dock',
    homeLabel: 'Chrono dock',
    power: 'ring',
    aerial: 'tech',
    color: [0.85, 0.65, 0.15]
  },
  {
    id: 'captain-atom-core',
    codename: 'Captain Atom Core',
    tagline: 'Quantum energy burst',
    districtId: 'sokovia-memorial',
    homeLabel: 'Reactor memorial',
    power: 'beam',
    aerial: 'native',
    color: [0.55, 0.72, 0.95]
  },
  {
    id: 'red-cyclone',
    codename: 'Red Cyclone',
    tagline: 'Wind-body android',
    districtId: 'coast-city',
    homeLabel: 'Breezy pier',
    power: 'telekinesis',
    aerial: 'native',
    color: [0.92, 0.22, 0.18]
  },
  {
    id: 'new-god-vanguard',
    codename: 'New God Vanguard',
    tagline: 'Astro harness raid',
    districtId: 'asgard-embassy',
    homeLabel: 'War bridge',
    power: 'beam',
    aerial: 'native',
    color: [0.72, 0.38, 0.18]
  },
  {
    id: 'raven-shade',
    codename: 'Raven Shade',
    tagline: 'Soul-self glide',
    districtId: 'gotham-nights',
    homeLabel: 'Occult loft',
    power: 'telekinesis',
    aerial: 'glide',
    color: [0.35, 0.22, 0.62]
  },
  {
    id: 'ki-maiden',
    codename: 'Ki Maiden',
    tagline: 'Infinite ki hover',
    districtId: 'ki-plateau',
    homeLabel: 'Mesa rings',
    power: 'ki',
    aerial: 'ki',
    color: [0.95, 0.35, 0.82]
  },
  {
    id: 'pan-spark',
    codename: 'Pan Spark',
    tagline: 'Young ki flyer',
    districtId: 'ki-plateau',
    homeLabel: 'Training mesa',
    power: 'ki',
    aerial: 'ki',
    color: [0.85, 0.45, 0.22]
  },
  {
    id: 'undefeated-youth',
    codename: 'Undefeated Youth',
    tagline: 'Viltrumite hover',
    districtId: 'viltrum-reach',
    homeLabel: 'Grayson loft',
    power: 'beam',
    aerial: 'native',
    color: [0.55, 0.35, 0.92]
  },
  {
    id: 'atom-eve-architect',
    codename: 'Atom Eve Architect',
    tagline: 'Matter-construct flight',
    districtId: 'viltrum-reach',
    homeLabel: 'Lattice studio',
    power: 'telekinesis',
    aerial: 'native',
    color: [0.92, 0.42, 0.62]
  },
  {
    id: 'tech-jacket-host',
    codename: 'Tech Jacket Host',
    tagline: 'Living armor space glide',
    districtId: 'nova-station',
    homeLabel: 'Host berths',
    power: 'repulsor',
    aerial: 'tech',
    color: [0.22, 0.75, 0.88]
  },
  {
    id: 'condor-warden',
    codename: 'Condor Warden',
    tagline: 'Learned condor wings',
    districtId: 'golden-mile',
    homeLabel: 'Milestone nest',
    power: 'telekinesis',
    aerial: 'native',
    color: [0.18, 0.22, 0.32]
  },
  {
    id: 'bullet-ascender',
    codename: 'Bullet Ascender',
    tagline: 'Gravity collar flight',
    districtId: 'golden-mile',
    homeLabel: 'Ascender tower',
    power: 'beam',
    aerial: 'tech',
    color: [0.82, 0.15, 0.18]
  },
  {
    id: 'air-mote',
    codename: 'Air Mote',
    tagline: 'Lighter-than-air drift',
    districtId: 'golden-mile',
    homeLabel: 'Float cellar',
    power: 'telekinesis',
    aerial: 'glide',
    color: [0.62, 0.85, 0.95]
  },
  {
    id: 'moth-signal',
    codename: 'Moth Signal',
    tagline: 'Winged mystery glide',
    districtId: 'golden-mile',
    homeLabel: 'Signal belfry',
    power: 'optic',
    aerial: 'glide',
    color: [0.72, 0.62, 0.42]
  },
  {
    id: 'chrome-convoy',
    codename: 'Chrome Convoy',
    tagline: 'Foot boost ram — no alt-mode',
    districtId: 'ion-foundry',
    homeLabel: 'Convoy bay',
    power: 'repulsor',
    aerial: 'foot-boost',
    color: [0.82, 0.12, 0.15]
  },
  {
    id: 'crimson-ace',
    codename: 'Crimson Ace',
    tagline: 'Righteous foot boosters',
    districtId: 'ion-foundry',
    homeLabel: 'Ace hangar',
    power: 'beam',
    aerial: 'foot-boost',
    color: [0.88, 0.18, 0.12]
  },
  {
    id: 'nitro-phantom',
    codename: 'Nitro Phantom',
    tagline: 'Phantom foot rockets — skip transform',
    districtId: 'ion-foundry',
    homeLabel: 'Phantom pad',
    power: 'repulsor',
    aerial: 'foot-boost',
    color: [0.55, 0.52, 0.65]
  },
  {
    id: 'patriot-apex',
    codename: 'Patriot Apex',
    tagline: 'Gray patriot hover',
    districtId: 'metropolis',
    homeLabel: 'Tower suite',
    power: 'beam',
    aerial: 'native',
    color: [0.95, 0.88, 0.72]
  },
  {
    id: 'spectrum-ranger',
    codename: 'Spectrum Ranger',
    tagline: 'Squad foot boosters',
    districtId: 'nova-station',
    homeLabel: 'Ranger hangar',
    power: 'ring',
    aerial: 'foot-boost',
    color: [0.92, 0.22, 0.55]
  }
];

export const NEW_VILLAIN_DEFS: CompactVillain[] = [
  {
    id: 'annihilus-gate',
    codename: 'Annihilus Gate',
    tagline: 'Cosmic rod siege',
    universe: 'marvel',
    aerial: 'native',
    primaryRivalHeroId: 'cosmic-envoy',
    extraRivals: ['comet-surfer', 'nova-centurion'],
    color: [0.95, 0.72, 0.12]
  },
  {
    id: 'raider-corsair',
    codename: 'Raider Corsair',
    tagline: 'Star-lord brigand',
    universe: 'marvel',
    aerial: 'tech',
    primaryRivalHeroId: 'starbound-outlaw',
    extraRivals: ['trickster-prince'],
    color: [0.45, 0.22, 0.62]
  },
  {
    id: 'livewire-surge',
    codename: 'Livewire Surge',
    tagline: 'Hovering electricity',
    universe: 'dc',
    aerial: 'native',
    primaryRivalHeroId: 'monarch-sting',
    color: [0.85, 0.95, 0.22]
  },
  {
    id: 'magus-mirror',
    codename: 'Magus Mirror',
    tagline: 'Cosmic zeal siege',
    universe: 'marvel',
    aerial: 'native',
    primaryRivalHeroId: 'adam-halo',
    color: [0.72, 0.55, 0.18]
  },
  {
    id: 'ocean-usurper',
    codename: 'Ocean Usurper',
    tagline: 'Trident tempest',
    universe: 'dc',
    aerial: 'native',
    primaryRivalHeroId: 'subsurface-sovereign',
    color: [0.12, 0.42, 0.82]
  },
  {
    id: 'iron-sentinel',
    codename: 'Iron Sentinel',
    tagline: 'Master mold jet',
    universe: 'marvel',
    aerial: 'tech',
    primaryRivalHeroId: 'magnetic-ace',
    extraRivals: ['frost-monarch'],
    color: [0.35, 0.35, 0.42]
  },
  {
    id: 'red-monarch',
    codename: 'Red Monarch',
    tagline: 'Red heat hover',
    universe: 'marvel',
    aerial: 'native',
    primaryRivalHeroId: 'sunspot-flare',
    extraRivals: ['gamma-titan'],
    color: [0.92, 0.18, 0.08]
  },
  {
    id: 'sauron-gaze',
    codename: 'Sauron Gaze',
    tagline: 'Pteranodon siege',
    universe: 'marvel',
    aerial: 'native',
    primaryRivalHeroId: 'moth-signal',
    extraRivals: ['storm-caller'],
    color: [0.62, 0.72, 0.22]
  },
  {
    id: 'iron-monger-echo',
    codename: 'Iron Monger Echo',
    tagline: 'Heavy warsuit',
    universe: 'marvel',
    aerial: 'tech',
    primaryRivalHeroId: 'red-codriver',
    extraRivals: ['tin-aviator'],
    color: [0.32, 0.55, 0.28]
  },
  {
    id: 'vulture-scavenger',
    codename: 'Vulture Scavenger',
    tagline: 'Wing harness stalk',
    universe: 'marvel',
    aerial: 'tech',
    primaryRivalHeroId: 'scarab-pilot',
    extraRivals: ['shade-knight', 'wing-captain'],
    color: [0.55, 0.62, 0.38]
  },
  {
    id: 'lex-frame',
    codename: 'Lex Frame',
    tagline: 'Corporate warsuit',
    universe: 'dc',
    aerial: 'tech',
    primaryRivalHeroId: 'patriot-apex',
    extraRivals: ['solar-apex', 'power-echo'],
    color: [0.72, 0.62, 0.35]
  },
  {
    id: 'parasite-leech',
    codename: 'Parasite Leech',
    tagline: 'Power drain leap',
    universe: 'dc',
    aerial: 'native',
    primaryRivalHeroId: 'rogue-paragon',
    color: [0.62, 0.82, 0.28]
  },
  {
    id: 'bleez-rage',
    codename: 'Bleez Rage',
    tagline: 'Red lantern rage jet',
    universe: 'dc',
    aerial: 'native',
    primaryRivalHeroId: 'garnet-brawler',
    color: [0.92, 0.08, 0.12]
  },
  {
    id: 'goku-shade',
    codename: 'Goku Shade',
    tagline: 'Timeline ki tyrant',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'time-blade',
    extraRivals: ['ki-wanderer'],
    color: [0.22, 0.18, 0.28]
  },
  {
    id: 'parasite-infant',
    codename: 'Parasite Infant',
    tagline: 'Possession drift',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'hybrid-warden',
    color: [0.85, 0.72, 0.55]
  },
  {
    id: 'omega-android',
    codename: 'Omega Android',
    tagline: 'Absorbing energy siege',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'ki-sage',
    color: [0.15, 0.18, 0.22]
  },
  {
    id: 'ember-dragon',
    codename: 'Ember Dragon',
    tagline: 'Sun-hot ki',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'ki-prince',
    extraRivals: ['emperor-frieze'],
    color: [0.95, 0.35, 0.08]
  },
  {
    id: 'ledger-brute',
    codename: 'Ledger Brute',
    tagline: 'Imeka enforcer',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'pan-spark',
    color: [0.55, 0.48, 0.72]
  },
  {
    id: 'silver-regent',
    codename: 'Silver Regent',
    tagline: 'Meta-cool regent',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'ki-wanderer',
    extraRivals: ['emperor-frieze'],
    color: [0.75, 0.82, 0.92]
  },
  {
    id: 'throne-viltrum',
    codename: 'Throne Viltrum',
    tagline: 'Grand regent siege',
    universe: 'indie',
    aerial: 'native',
    primaryRivalHeroId: 'undefeated-youth',
    extraRivals: ['solar-apex'],
    color: [0.82, 0.12, 0.18]
  },
  {
    id: 'battle-brute',
    codename: 'Battle Brute',
    tagline: 'Arena leap titan',
    universe: 'indie',
    aerial: 'native',
    primaryRivalHeroId: 'atom-eve-architect',
    color: [0.42, 0.28, 0.22]
  },
  {
    id: 'deceit-winger',
    codename: 'Deceit Winger',
    tagline: 'Seeker foot rockets',
    universe: 'cyber',
    aerial: 'foot-boost',
    primaryRivalHeroId: 'crimson-ace',
    color: [0.72, 0.35, 0.22]
  },
  {
    id: 'megaton-forge',
    codename: 'Megaton Forge',
    tagline: 'Gunship foot boost',
    universe: 'cyber',
    aerial: 'foot-boost',
    primaryRivalHeroId: 'chrome-convoy',
    color: [0.55, 0.55, 0.58]
  },
  {
    id: 'bone-shredder',
    codename: 'Bone Shredder',
    tagline: 'Cassette foot falcon',
    universe: 'cyber',
    aerial: 'foot-boost',
    primaryRivalHeroId: 'nitro-phantom',
    color: [0.32, 0.28, 0.35]
  },
  {
    id: 'sound-barrage',
    codename: 'Sound Barrage',
    tagline: 'Drone foot barrage',
    universe: 'cyber',
    aerial: 'foot-boost',
    primaryRivalHeroId: 'spectrum-ranger',
    color: [0.45, 0.42, 0.72]
  },
  {
    id: 'azure-patriarch',
    codename: 'Azure Patriarch',
    tagline: 'Viltrumite patriarch',
    universe: 'indie',
    aerial: 'native',
    primaryRivalHeroId: 'golden-sentry',
    extraRivals: ['undefeated-youth', 'solar-apex'],
    color: [0.35, 0.42, 0.92]
  },
  {
    id: 'turles-jackal',
    codename: 'Turles Jackal',
    tagline: 'Space pirate tree',
    universe: 'dbz',
    aerial: 'ki',
    primaryRivalHeroId: 'red-cyclone',
    extraRivals: ['comet-surfer', 'dark-saiyan-jackal', 'condor-warden'],
    color: [0.22, 0.55, 0.32]
  },
  {
    id: 'stratos-raider',
    codename: 'Stratos Raider',
    tagline: 'High-altitude warsuit',
    universe: 'marvel',
    aerial: 'tech',
    primaryRivalHeroId: 'sky-tyrant',
    color: [0.38, 0.42, 0.55]
  },
  {
    id: 'thermal-wisp',
    codename: 'Thermal Wisp',
    tagline: 'Heat-ripple stalker',
    universe: 'golden',
    aerial: 'native',
    primaryRivalHeroId: 'air-mote',
    color: [0.92, 0.55, 0.22]
  },
  {
    id: 'orbit-lancer',
    codename: 'Orbit Lancer',
    tagline: 'Ringworld spear siege',
    universe: 'indie',
    aerial: 'tech',
    primaryRivalHeroId: 'tech-jacket-host',
    color: [0.25, 0.62, 0.78]
  },
  {
    id: 'cryo-stalker',
    codename: 'Cryo Stalker',
    tagline: 'Ice-edge hunter',
    universe: 'marvel',
    aerial: 'native',
    primaryRivalHeroId: 'frost-monarch',
    color: [0.62, 0.82, 0.95]
  },
  {
    id: 'nano-swarm-queen',
    codename: 'Nano Swarm Queen',
    tagline: 'Scarab hive siege',
    universe: 'dc',
    aerial: 'tech',
    primaryRivalHeroId: 'scarab-pilot',
    color: [0.35, 0.72, 0.42]
  },
  {
    id: 'freq-hijacker',
    codename: 'Freq Hijacker',
    tagline: 'Resonance foot jammer',
    universe: 'cyber',
    aerial: 'foot-boost',
    primaryRivalHeroId: 'spectrum-ranger',
    color: [0.55, 0.25, 0.82]
  },
  {
    id: 'rook-phantom',
    codename: 'Rook Phantom',
    tagline: 'Golden-age wing shade',
    universe: 'golden',
    aerial: 'native',
    primaryRivalHeroId: 'condor-warden',
    color: [0.18, 0.22, 0.35]
  }
];

const NEW_VILLAIN_ID_SET = new Set(NEW_VILLAIN_DEFS.map((d) => d.id));

/** Assign canonical primary rival on existing villains when expansion heroes join. */
export const LEGACY_VILLAIN_PRIMARY: Record<string, string> = Object.fromEntries(
  EXPANSION_NEMESIS_PAIRS.filter(([, vid]) => !NEW_VILLAIN_ID_SET.has(vid)).map(([hid, vid]) => [
    vid,
    hid
  ])
);

function heroFromCompact(d: CompactHero): HeroSpec {
  const cruise = d.cruise ?? 420;
  const boost = d.boost ?? cruise * 4.5;
  return {
    id: d.id,
    codename: d.codename,
    tagline: d.tagline,
    districtId: d.districtId,
    homeLabel: d.homeLabel,
    powers: [d.power],
    flight: { cruiseKmh: cruise, boostKmh: boost, agility: 1, mass: 88 },
    energy: {
      staminaMax: 120,
      regenPerSec: 20,
      superCooldownSec: 18,
      primaryCooldownSec: 0.28
    },
    smashRadius: 3.2,
    forms: [
      {
        id: 'base',
        label: 'Base',
        suitRole: 'balanced',
        abilities: [d.tagline],
        kitPrimary: d.power,
        speedMul: 1,
        powerMul: 1,
        color: d.color
      }
    ],
    defaultFormId: 'base',
    aerial: d.aerial
  };
}

function villainFromCompact(d: CompactVillain): ExpansionVillainSpec {
  const rivals = [d.primaryRivalHeroId, ...(d.extraRivals ?? [])];
  return {
    id: d.id,
    codename: d.codename,
    tagline: d.tagline,
    universe: d.universe,
    aerial: d.aerial,
    primaryRivalHeroId: d.primaryRivalHeroId,
    rivalHeroIds: rivals,
    color: d.color,
    hpMul: 1.25,
    speedMul: 1.05,
    siegeMul: 1.35,
    scale: [2.9, 3.4, 2.3]
  };
}

export function buildExpansionHeroes(): HeroSpec[] {
  return HERO_DEFS.map(heroFromCompact);
}

export function buildExpansionVillains(): ExpansionVillainSpec[] {
  return NEW_VILLAIN_DEFS.map(villainFromCompact);
}

function dedupeNemesisOverridesLastWin(pairs: [string, string][]): [string, string][] {
  const byHero = new Map<string, string>();
  for (const [heroId, villainId] of pairs) byHero.set(heroId, villainId);
  return [...byHero.entries()];
}

/** Nemesis overrides applied last (wins over earlier villain primary assignment). */
const NEMESIS_PAIR_OVERRIDES_RAW: [string, string][] = [
  ['solar-apex', 'titan-snap-echo']
];

export const NEMESIS_PAIR_OVERRIDES: [string, string][] = dedupeNemesisOverridesLastWin(
  NEMESIS_PAIR_OVERRIDES_RAW
);

/** Villain id → canonical primary hero (same merge order as `applyVillainPrimaryRivals`). */
export function buildForcedVillainPrimaryHeroMap(): Map<string, string> {
  const forcedPrimary = new Map<string, string>();
  for (const [heroId, villainId] of [...CORE_HERO_NEMESIS, ...EXPANSION_NEMESIS_PAIRS]) {
    forcedPrimary.set(villainId, heroId);
  }
  for (const [villainId, heroId] of Object.entries(LEGACY_VILLAIN_PRIMARY)) {
    forcedPrimary.set(villainId, heroId);
  }
  for (const [heroId, villainId] of NEMESIS_PAIR_OVERRIDES) {
    forcedPrimary.set(villainId, heroId);
  }
  return forcedPrimary;
}

export function primaryVillainIdForHero(heroId: string): string | undefined {
  const heroToVillain = new Map<string, string>();
  for (const [hid, villainId] of [...CORE_HERO_NEMESIS, ...EXPANSION_NEMESIS_PAIRS]) {
    heroToVillain.set(hid, villainId);
  }
  for (const [villainId, hid] of Object.entries(LEGACY_VILLAIN_PRIMARY)) {
    heroToVillain.set(hid, villainId);
  }
  for (const [hid, villainId] of NEMESIS_PAIR_OVERRIDES) {
    heroToVillain.set(hid, villainId);
  }
  return heroToVillain.get(heroId);
}

export function applyVillainPrimaryRivals<T extends { id: string; rivalHeroIds: string[]; primaryRivalHeroId?: string }>(
  clones: T[],
  validHeroIds: Set<string>,
  villainIds: Set<string>
): T[] {
  const forcedPrimary = buildForcedVillainPrimaryHeroMap();

  const isHero = (id: string) => validHeroIds.has(id) && !villainIds.has(id);
  const claimed = new Set<string>();
  const out = clones.map((v) => ({ ...v, rivalHeroIds: [...v.rivalHeroIds] }));

  for (const v of out) {
    const forced = forcedPrimary.get(v.id);
    if (!forced || !isHero(forced)) continue;
    v.primaryRivalHeroId = forced;
    if (!v.rivalHeroIds.includes(forced)) v.rivalHeroIds.unshift(forced);
    claimed.add(forced);
  }

  for (const v of out) {
    if (v.primaryRivalHeroId) continue;
    const pick =
      v.rivalHeroIds.find((h) => isHero(h) && !claimed.has(h)) ??
      v.rivalHeroIds.find((h) => isHero(h));
    if (!pick) continue;
    v.primaryRivalHeroId = pick;
    claimed.add(pick);
  }

  return out;
}

/** Mutation map entries for expansion heroes. */
export const EXPANSION_HERO_MUTATIONS: Record<string, { mutatesFrom: string; universe: MutationUniverse }> = {
  'cosmic-envoy': { mutatesFrom: 'Captain Marvel archetype', universe: 'marvel' },
  'starbound-outlaw': { mutatesFrom: 'Star-Lord archetype', universe: 'marvel' },
  'monarch-sting': { mutatesFrom: 'Wasp archetype', universe: 'marvel' },
  'ikaris-prime': { mutatesFrom: 'Ikaris / Eternals', universe: 'marvel' },
  'adam-halo': { mutatesFrom: 'Adam Warlock', universe: 'marvel' },
  'subsurface-sovereign': { mutatesFrom: 'Namor', universe: 'marvel' },
  'magnetic-ace': { mutatesFrom: 'Quicksilver', universe: 'marvel' },
  'sunspot-flare': { mutatesFrom: 'Sunspot', universe: 'marvel' },
  'rogue-paragon': { mutatesFrom: 'Rogue', universe: 'marvel' },
  'nth-wing': { mutatesFrom: 'Hawkgirl', universe: 'dc' },
  'power-echo': { mutatesFrom: 'Power Girl', universe: 'dc' },
  'scarab-pilot': { mutatesFrom: 'Blue Beetle', universe: 'dc' },
  'booster-chancellor': { mutatesFrom: 'Booster Gold', universe: 'dc' },
  'captain-atom-core': { mutatesFrom: 'Captain Atom', universe: 'dc' },
  'red-cyclone': { mutatesFrom: 'Red Tornado', universe: 'dc' },
  'new-god-vanguard': { mutatesFrom: 'Orion', universe: 'dc' },
  'raven-shade': { mutatesFrom: 'Raven', universe: 'dc' },
  'ki-maiden': { mutatesFrom: 'Android 18 archetype', universe: 'dbz' },
  'pan-spark': { mutatesFrom: 'Pan (GT)', universe: 'dbz' },
  'undefeated-youth': { mutatesFrom: 'Invincible', universe: 'indie' },
  'atom-eve-architect': { mutatesFrom: 'Atom Eve', universe: 'indie' },
  'tech-jacket-host': { mutatesFrom: 'Tech Jacket', universe: 'indie' },
  'condor-warden': { mutatesFrom: 'Black Condor', universe: 'golden' },
  'bullet-ascender': { mutatesFrom: 'Bulletman', universe: 'golden' },
  'air-mote': { mutatesFrom: 'Airmale', universe: 'golden' },
  'moth-signal': { mutatesFrom: 'Moth (Fox)', universe: 'golden' },
  'chrome-convoy': { mutatesFrom: 'Optimus Prime archetype', universe: 'cyber' },
  'crimson-ace': { mutatesFrom: 'Jetfire archetype', universe: 'cyber' },
  'nitro-phantom': { mutatesFrom: 'Triple changer archetype', universe: 'cyber' },
  'patriot-apex': { mutatesFrom: 'Patriot satire pastiche', universe: 'indie' },
  'spectrum-ranger': { mutatesFrom: 'Sentai ranger archetype', universe: 'cyber' }
};

export const EXPANSION_VILLAIN_MUTATIONS: Record<string, { mutatesFrom: string; universe: MutationUniverse }> = {
  'annihilus-gate': { mutatesFrom: 'Annihilus', universe: 'marvel' },
  'raider-corsair': { mutatesFrom: 'Star pirate', universe: 'marvel' },
  'livewire-surge': { mutatesFrom: 'Livewire', universe: 'dc' },
  'magus-mirror': { mutatesFrom: 'Magus', universe: 'marvel' },
  'ocean-usurper': { mutatesFrom: 'Ocean Master', universe: 'dc' },
  'iron-sentinel': { mutatesFrom: 'Master Mold', universe: 'marvel' },
  'red-monarch': { mutatesFrom: 'Red Hulk', universe: 'marvel' },
  'sauron-gaze': { mutatesFrom: 'Sauron (pteranodon)', universe: 'marvel' },
  'iron-monger-echo': { mutatesFrom: 'Iron Monger', universe: 'marvel' },
  'vulture-scavenger': { mutatesFrom: 'Vulture', universe: 'marvel' },
  'lex-frame': { mutatesFrom: 'Lex Luthor warsuit', universe: 'dc' },
  'parasite-leech': { mutatesFrom: 'Parasite', universe: 'dc' },
  'bleez-rage': { mutatesFrom: 'Bleez', universe: 'dc' },
  'goku-shade': { mutatesFrom: 'Goku Black / Zamasu', universe: 'dbz' },
  'parasite-infant': { mutatesFrom: 'Baby (GT)', universe: 'dbz' },
  'omega-android': { mutatesFrom: 'Super 17', universe: 'dbz' },
  'ember-dragon': { mutatesFrom: 'Nuova Shenron', universe: 'dbz' },
  'ledger-brute': { mutatesFrom: 'Ledgic', universe: 'dbz' },
  'silver-regent': { mutatesFrom: 'Cooler', universe: 'dbz' },
  'throne-viltrum': { mutatesFrom: 'Thragg', universe: 'indie' },
  'battle-brute': { mutatesFrom: 'Battle Beast', universe: 'indie' },
  'deceit-winger': { mutatesFrom: 'Starscream archetype', universe: 'cyber' },
  'megaton-forge': { mutatesFrom: 'Megatron archetype', universe: 'cyber' },
  'bone-shredder': { mutatesFrom: 'Laserbeak archetype', universe: 'cyber' },
  'sound-barrage': { mutatesFrom: 'Soundwave archetype', universe: 'cyber' },
  'azure-patriarch': { mutatesFrom: 'Omni-Man', universe: 'indie' },
  'turles-jackal': { mutatesFrom: 'Turles', universe: 'dbz' },
  'stratos-raider': { mutatesFrom: 'Iron Patriot pastiche', universe: 'marvel' },
  'thermal-wisp': { mutatesFrom: 'Golden age heat wraith', universe: 'golden' },
  'orbit-lancer': { mutatesFrom: 'Ringworld enforcer pastiche', universe: 'indie' },
  'cryo-stalker': { mutatesFrom: 'Frost satellite stalker', universe: 'marvel' },
  'nano-swarm-queen': { mutatesFrom: 'Reach nano-swarm', universe: 'dc' },
  'freq-hijacker': { mutatesFrom: 'Resonance jammer pastiche', universe: 'cyber' },
  'rook-phantom': { mutatesFrom: 'Black wing phantom', universe: 'golden' }
};
