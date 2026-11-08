/** Homage codenames only — not affiliated with rights holders. */

import type { AerialMobility } from './aerial-mobility';

export type PowerKind =
  | 'beam'
  | 'repulsor'
  | 'ring'
  | 'thunder'
  | 'ki'
  | 'optic'
  | 'web'
  | 'telekinesis'
  | 'synth';

export type FormToggleId = string;

export interface HeroForm {
  id: FormToggleId;
  label: string;
  speedMul: number;
  powerMul: number;
  color: [number, number, number];
}

export interface HeroSpec {
  id: string;
  codename: string;
  tagline: string;
  districtId: string;
  homeLabel: string;
  powers: PowerKind[];
  flight: {
    cruiseKmh: number;
    boostKmh: number;
    agility: number;
    mass: number;
  };
  energy: {
    staminaMax: number;
    regenPerSec: number;
    superCooldownSec: number;
    primaryCooldownSec: number;
  };
  smashRadius: number;
  forms: HeroForm[];
  defaultFormId: FormToggleId;
  suitVariants?: { id: string; label: string; color: [number, number, number] }[];
  /** Canon flight basis — jetpack / glide / web for grounded homages */
  aerial: AerialMobility;
}

export const HERO_ROSTER: HeroSpec[] = [
  {
    id: 'solar-apex',
    codename: 'Solar Apex',
    tagline: 'Last son energy — shockwave ram',
    districtId: 'metropolis',
    homeLabel: 'Daily Planet Spire',
    powers: ['beam'],
    flight: { cruiseKmh: 420, boostKmh: 2400, agility: 0.85, mass: 95 },
    energy: { staminaMax: 120, regenPerSec: 18, superCooldownSec: 22, primaryCooldownSec: 0.35 },
    smashRadius: 4.2,
    forms: [
      { id: 'cape', label: 'Classic cape', speedMul: 1, powerMul: 1, color: [0.12, 0.22, 0.75] },
      { id: 'godmode', label: 'Solar flare', speedMul: 1.35, powerMul: 1.5, color: [0.95, 0.82, 0.2] }
    ],
    defaultFormId: 'cape',
    aerial: 'native'
  },
  {
    id: 'emerald-pilot',
    codename: 'Emerald Pilot',
    tagline: 'Will-powered constructs',
    districtId: 'coast-city',
    homeLabel: 'Watchtower Dock',
    powers: ['ring'],
    flight: { cruiseKmh: 380, boostKmh: 2100, agility: 1.05, mass: 88 },
    energy: { staminaMax: 110, regenPerSec: 22, superCooldownSec: 18, primaryCooldownSec: 0.28 },
    smashRadius: 3.5,
    forms: [
      { id: 'marine', label: 'Marine', speedMul: 1, powerMul: 1, color: [0.05, 0.55, 0.25] },
      { id: 'hard', label: 'Hard-light shell', speedMul: 0.92, powerMul: 1.25, color: [0.15, 0.85, 0.55] }
    ],
    defaultFormId: 'marine',
    aerial: 'ring'
  },
  {
    id: 'tin-aviator',
    codename: 'Tin Aviator',
    tagline: 'Repulsor flight systems',
    districtId: 'stark-nexus',
    homeLabel: 'Stark Spire Hangar',
    powers: ['repulsor'],
    flight: { cruiseKmh: 360, boostKmh: 2200, agility: 1.1, mass: 120 },
    energy: { staminaMax: 100, regenPerSec: 25, superCooldownSec: 16, primaryCooldownSec: 0.22 },
    smashRadius: 3.2,
    suitVariants: [
      { id: 'mk1', label: 'Mk I scrap', color: [0.45, 0.35, 0.28] },
      { id: 'mk3', label: 'Mk III red-gold', color: [0.75, 0.15, 0.12] },
      { id: 'mk7', label: 'Mk VII party', color: [0.82, 0.2, 0.08] },
      { id: 'mk42', label: 'Mk XLII modular', color: [0.55, 0.55, 0.6] },
      { id: 'mk50', label: 'Mk L nanite', color: [0.85, 0.75, 0.2] },
      { id: 'hulkbuster', label: 'Heavy interceptor', color: [0.6, 0.12, 0.12] }
    ],
    forms: [
      { id: 'mk3', label: 'Mk III', speedMul: 1, powerMul: 1, color: [0.75, 0.15, 0.12] },
      { id: 'stealth', label: 'Stealth', speedMul: 1.15, powerMul: 0.85, color: [0.15, 0.18, 0.22] }
    ],
    defaultFormId: 'mk3',
    aerial: 'tech'
  },
  {
    id: 'chrome-sage',
    codename: 'Chrome Sage',
    tagline: 'Density-shift phase ram',
    districtId: 'wakanda-gateway',
    homeLabel: 'Vibranium Lab Balcony',
    powers: ['synth', 'beam'],
    flight: { cruiseKmh: 400, boostKmh: 2000, agility: 0.95, mass: 130 },
    energy: { staminaMax: 130, regenPerSec: 20, superCooldownSec: 20, primaryCooldownSec: 0.32 },
    smashRadius: 3.8,
    forms: [
      { id: 'solid', label: 'Solid', speedMul: 1, powerMul: 1, color: [0.8, 0.12, 0.12] },
      { id: 'ghost', label: 'Intangible', speedMul: 1.2, powerMul: 0.7, color: [0.65, 0.7, 0.85] }
    ],
    defaultFormId: 'solid',
    aerial: 'native'
  },
  {
    id: 'chrome-overmind',
    codename: 'Chrome Overmind',
    tagline: 'Drone swarm salvos',
    districtId: 'sokovia-memorial',
    homeLabel: 'Memorial Apex',
    powers: ['repulsor', 'beam'],
    flight: { cruiseKmh: 340, boostKmh: 1900, agility: 1.15, mass: 105 },
    energy: { staminaMax: 90, regenPerSec: 28, superCooldownSec: 14, primaryCooldownSec: 0.18 },
    smashRadius: 3.0,
    forms: [{ id: 'prime', label: 'Prime body', speedMul: 1, powerMul: 1, color: [0.35, 0.4, 0.45] }],
    defaultFormId: 'prime',
    aerial: 'tech'
  },
  {
    id: 'doctor-doom',
    codename: 'Dr. Doom',
    tagline: 'Sovereign blast — doomfield siege',
    districtId: 'sokovia-memorial',
    homeLabel: 'Royal Citadel',
    powers: ['beam', 'telekinesis'],
    flight: { cruiseKmh: 350, boostKmh: 2050, agility: 0.95, mass: 118 },
    energy: { staminaMax: 125, regenPerSec: 20, superCooldownSec: 17, primaryCooldownSec: 0.28 },
    smashRadius: 3.6,
    forms: [
      { id: 'iron', label: 'Iron regalia', speedMul: 1, powerMul: 1.1, color: [0.42, 0.45, 0.5] },
      { id: 'hood', label: 'Hooded sovereign', speedMul: 0.95, powerMul: 1.25, color: [0.12, 0.42, 0.22] }
    ],
    defaultFormId: 'iron',
    aerial: 'tech'
  },
  {
    id: 'storm-hammer',
    codename: 'Storm Hammer',
    tagline: 'Lightning arc smash',
    districtId: 'asgard-embassy',
    homeLabel: 'Rainbow Bridge Gate',
    powers: ['thunder'],
    flight: { cruiseKmh: 350, boostKmh: 1800, agility: 0.8, mass: 140 },
    energy: { staminaMax: 140, regenPerSec: 16, superCooldownSec: 24, primaryCooldownSec: 0.45 },
    smashRadius: 4.5,
    forms: [
      { id: 'worthy', label: 'Worthy', speedMul: 1, powerMul: 1, color: [0.15, 0.35, 0.65] },
      { id: 'berserk', label: 'Berserk', speedMul: 1.1, powerMul: 1.35, color: [0.55, 0.2, 0.15] }
    ],
    defaultFormId: 'worthy',
    aerial: 'native'
  },
  {
    id: 'ki-wanderer',
    codename: 'Ki Wanderer',
    tagline: 'Instant transmission burst',
    districtId: 'ki-plateau',
    homeLabel: 'Lookout Mesa',
    powers: ['ki'],
    flight: { cruiseKmh: 500, boostKmh: 3200, agility: 1.25, mass: 78 },
    energy: { staminaMax: 150, regenPerSec: 30, superCooldownSec: 18, primaryCooldownSec: 0.2 },
    smashRadius: 3.6,
    forms: [
      { id: 'base', label: 'Base', speedMul: 1, powerMul: 1, color: [0.85, 0.55, 0.15] },
      { id: 'ascended', label: 'Ascended', speedMul: 1.45, powerMul: 1.55, color: [0.95, 0.25, 0.15] }
    ],
    defaultFormId: 'base',
    aerial: 'ki'
  },
  {
    id: 'ki-prince',
    codename: 'Ki Prince',
    tagline: 'Galick crash dive',
    districtId: 'ki-plateau',
    homeLabel: 'Royal Training Crater',
    powers: ['ki'],
    flight: { cruiseKmh: 480, boostKmh: 3000, agility: 1.2, mass: 82 },
    energy: { staminaMax: 145, regenPerSec: 28, superCooldownSec: 17, primaryCooldownSec: 0.22 },
    smashRadius: 3.7,
    forms: [
      { id: 'base', label: 'Base', speedMul: 1, powerMul: 1, color: [0.22, 0.45, 0.85] },
      { id: 'ascended', label: 'Ascended', speedMul: 1.4, powerMul: 1.5, color: [0.75, 0.15, 0.55] }
    ],
    defaultFormId: 'base',
    aerial: 'ki'
  },
  {
    id: 'wall-crawler',
    codename: 'Wall Crawler',
    tagline: 'Web-zip aerial swings',
    districtId: 'gotham-nights',
    homeLabel: 'Clock Tower Loft',
    powers: ['web'],
    flight: { cruiseKmh: 280, boostKmh: 1400, agility: 1.35, mass: 72 },
    energy: { staminaMax: 95, regenPerSec: 24, superCooldownSec: 15, primaryCooldownSec: 0.15 },
    smashRadius: 2.4,
    forms: [
      { id: 'classic', label: 'Classic', speedMul: 1, powerMul: 1, color: [0.75, 0.12, 0.12] },
      { id: 'stealth', label: 'Night', speedMul: 1.05, powerMul: 0.95, color: [0.12, 0.12, 0.18] }
    ],
    defaultFormId: 'classic',
    aerial: 'web-swing'
  },
  {
    id: 'red-codriver',
    codename: 'Red Codriver',
    tagline: 'Shoulder cannons',
    districtId: 'stark-nexus',
    homeLabel: 'Arsenal Bay',
    powers: ['repulsor'],
    flight: { cruiseKmh: 320, boostKmh: 1750, agility: 0.75, mass: 155 },
    energy: { staminaMax: 115, regenPerSec: 22, superCooldownSec: 19, primaryCooldownSec: 0.25 },
    smashRadius: 3.4,
    forms: [{ id: 'tank', label: 'Tank frame', speedMul: 1, powerMul: 1.15, color: [0.55, 0.12, 0.12] }],
    defaultFormId: 'tank',
    aerial: 'tech'
  },
  {
    id: 'martian-strider',
    codename: 'Martian Strider',
    tagline: 'Shape-shift phase beam',
    districtId: 'watchtower-annex',
    homeLabel: 'Orrery Deck',
    powers: ['telekinesis', 'beam'],
    flight: { cruiseKmh: 390, boostKmh: 2050, agility: 1.0, mass: 90 },
    energy: { staminaMax: 125, regenPerSec: 21, superCooldownSec: 21, primaryCooldownSec: 0.3 },
    smashRadius: 3.3,
    forms: [
      { id: 'green', label: 'True form', speedMul: 1, powerMul: 1, color: [0.12, 0.55, 0.35] },
      { id: 'human', label: 'Detective guise', speedMul: 0.95, powerMul: 0.9, color: [0.25, 0.3, 0.35] }
    ],
    defaultFormId: 'green',
    aerial: 'native'
  },
  {
    id: 'shade-knight',
    codename: 'Shade Knight',
    tagline: 'Gliding cape intercepts',
    districtId: 'gotham-nights',
    homeLabel: 'Clock Tower Loft',
    powers: ['web'],
    flight: { cruiseKmh: 260, boostKmh: 1200, agility: 1.3, mass: 85 },
    energy: { staminaMax: 100, regenPerSec: 26, superCooldownSec: 16, primaryCooldownSec: 0.18 },
    smashRadius: 2.2,
    forms: [
      { id: 'night', label: 'Night patrol', speedMul: 1, powerMul: 1, color: [0.1, 0.12, 0.16] },
      { id: 'tactical', label: 'Tactical jetpack', speedMul: 1.08, powerMul: 1.1, color: [0.2, 0.22, 0.28] }
    ],
    defaultFormId: 'night',
    aerial: 'glide'
  },
  {
    id: 'amazon-vanguard',
    codename: 'Amazon Vanguard',
    tagline: 'Lasso shock slam',
    districtId: 'watchtower-annex',
    homeLabel: 'Diplomatic Wing',
    powers: ['telekinesis'],
    flight: { cruiseKmh: 340, boostKmh: 1650, agility: 1.05, mass: 92 },
    energy: { staminaMax: 130, regenPerSec: 20, superCooldownSec: 20, primaryCooldownSec: 0.3 },
    smashRadius: 3.5,
    forms: [
      { id: 'regalia', label: 'Regalia', speedMul: 1, powerMul: 1.1, color: [0.75, 0.12, 0.15] },
      { id: 'stealth', label: 'Stealth', speedMul: 1.12, powerMul: 0.95, color: [0.15, 0.15, 0.2] }
    ],
    defaultFormId: 'regalia',
    aerial: 'native'
  },
  {
    id: 'bolt-archer',
    codename: 'Bolt Archer',
    tagline: 'ARC jetpack trick volleys',
    districtId: 'stark-nexus',
    homeLabel: 'Rooftop Range',
    powers: ['beam'],
    flight: { cruiseKmh: 220, boostKmh: 980, agility: 1.25, mass: 70 },
    energy: { staminaMax: 90, regenPerSec: 30, superCooldownSec: 14, primaryCooldownSec: 0.12 },
    smashRadius: 2.0,
    forms: [{ id: 'purple', label: 'Tech suit', speedMul: 1, powerMul: 1, color: [0.55, 0.15, 0.75] }],
    defaultFormId: 'purple',
    aerial: 'jetpack'
  },
  {
    id: 'ant-scale',
    codename: 'Ant Scale',
    tagline: 'Pym vector hop — belt jets',
    districtId: 'stark-nexus',
    homeLabel: 'Lab Sublevel',
    powers: ['synth'],
    flight: { cruiseKmh: 300, boostKmh: 1500, agility: 1.4, mass: 65 },
    energy: { staminaMax: 105, regenPerSec: 24, superCooldownSec: 15, primaryCooldownSec: 0.2 },
    smashRadius: 1.8,
    forms: [
      { id: 'small', label: 'Sub-scale', speedMul: 1.2, powerMul: 0.75, color: [0.65, 0.2, 0.15] },
      { id: 'giant', label: 'Giant', speedMul: 0.85, powerMul: 1.35, color: [0.55, 0.12, 0.12] }
    ],
    defaultFormId: 'small',
    aerial: 'jetpack'
  }
];

export function getHero(id: string): HeroSpec | undefined {
  return HERO_ROSTER.find((h) => h.id === id);
}

export const DEFAULT_HERO_ID = 'solar-apex';
