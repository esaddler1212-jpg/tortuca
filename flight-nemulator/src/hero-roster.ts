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
    tagline: 'Hal Jordan — will-powered constructs',
    districtId: 'coast-city',
    homeLabel: 'Coast Watchtower Dock',
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
    id: 'jade-architect',
    codename: 'Jade Architect',
    tagline: 'John Stewart — structural lattice ring',
    districtId: 'coast-city',
    homeLabel: 'Sector Fabricator Bay',
    powers: ['ring'],
    flight: { cruiseKmh: 370, boostKmh: 2050, agility: 0.98, mass: 92 },
    energy: { staminaMax: 115, regenPerSec: 21, superCooldownSec: 19, primaryCooldownSec: 0.3 },
    smashRadius: 3.8,
    forms: [
      { id: 'architect', label: 'Architect', speedMul: 1, powerMul: 1.12, color: [0.04, 0.48, 0.22] },
      { id: 'sniper', label: 'Sniper construct', speedMul: 0.95, powerMul: 1.28, color: [0.08, 0.35, 0.18] }
    ],
    defaultFormId: 'architect',
    aerial: 'ring'
  },
  {
    id: 'garnet-brawler',
    codename: 'Garnet Brawler',
    tagline: 'Guy Gardner — knuckle construct rush',
    districtId: 'coast-city',
    homeLabel: 'Sector Gym Ring',
    powers: ['ring'],
    flight: { cruiseKmh: 365, boostKmh: 1980, agility: 1.08, mass: 96 },
    energy: { staminaMax: 105, regenPerSec: 24, superCooldownSec: 16, primaryCooldownSec: 0.22 },
    smashRadius: 3.6,
    forms: [
      { id: 'brawler', label: 'Brawler', speedMul: 1.05, powerMul: 1.15, color: [0.12, 0.52, 0.2] },
      { id: 'red-hot', label: 'Red-hot will', speedMul: 1.12, powerMul: 1.25, color: [0.72, 0.18, 0.12] }
    ],
    defaultFormId: 'brawler',
    aerial: 'ring'
  },
  {
    id: 'spectrum-artist',
    codename: 'Spectrum Artist',
    tagline: 'Kyle Rayner — artist ring imagination',
    districtId: 'coast-city',
    homeLabel: 'Studio Loft Bay',
    powers: ['ring'],
    flight: { cruiseKmh: 375, boostKmh: 2080, agility: 1.1, mass: 86 },
    energy: { staminaMax: 112, regenPerSec: 23, superCooldownSec: 17, primaryCooldownSec: 0.26 },
    smashRadius: 3.4,
    forms: [
      { id: 'artist', label: 'Artist', speedMul: 1, powerMul: 1.05, color: [0.06, 0.58, 0.28] },
      { id: 'white', label: 'White-light echo', speedMul: 1.08, powerMul: 1.22, color: [0.92, 0.94, 0.96] }
    ],
    defaultFormId: 'artist',
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
    id: 'ki-sage',
    codename: 'Ki Sage',
    tagline: 'Regen barrage — stretch counter',
    districtId: 'ki-plateau',
    homeLabel: 'Sky Temple Ledge',
    powers: ['ki', 'beam'],
    flight: { cruiseKmh: 430, boostKmh: 2600, agility: 1.1, mass: 86 },
    energy: { staminaMax: 132, regenPerSec: 32, superCooldownSec: 17, primaryCooldownSec: 0.22 },
    smashRadius: 3.4,
    forms: [
      { id: 'tunic', label: 'Temple tunic', speedMul: 1, powerMul: 1, color: [0.22, 0.55, 0.32] },
      { id: 'orange', label: 'Orange gi', speedMul: 1.08, powerMul: 1.12, color: [0.92, 0.45, 0.12] }
    ],
    defaultFormId: 'tunic',
    aerial: 'ki'
  },
  {
    id: 'time-blade',
    codename: 'Time Blade',
    tagline: 'Sword flash — timeline dive',
    districtId: 'ki-plateau',
    homeLabel: 'Capsule Ruins',
    powers: ['ki', 'beam'],
    flight: { cruiseKmh: 470, boostKmh: 2900, agility: 1.22, mass: 80 },
    energy: { staminaMax: 128, regenPerSec: 27, superCooldownSec: 16, primaryCooldownSec: 0.2 },
    smashRadius: 3.3,
    forms: [
      { id: 'future', label: 'Future jacket', speedMul: 1, powerMul: 1.05, color: [0.15, 0.18, 0.42] },
      { id: 'rage', label: 'Super surge', speedMul: 1.35, powerMul: 1.4, color: [0.85, 0.22, 0.18] }
    ],
    defaultFormId: 'future',
    aerial: 'ki'
  },
  {
    id: 'hybrid-warden',
    codename: 'Hybrid Warden',
    tagline: 'Hidden potential smash',
    districtId: 'ki-plateau',
    homeLabel: 'Scholar Cliff',
    powers: ['ki'],
    flight: { cruiseKmh: 460, boostKmh: 2850, agility: 1.15, mass: 84 },
    energy: { staminaMax: 142, regenPerSec: 26, superCooldownSec: 18, primaryCooldownSec: 0.22 },
    smashRadius: 3.8,
    forms: [
      { id: 'scholar', label: 'Scholar', speedMul: 0.95, powerMul: 1.15, color: [0.45, 0.32, 0.22] },
      { id: 'unleashed', label: 'Unleashed', speedMul: 1.25, powerMul: 1.45, color: [0.95, 0.75, 0.2] }
    ],
    defaultFormId: 'scholar',
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
    id: 'velocity-streak',
    codename: 'Velocity Streak',
    tagline: 'Speed-force afterimage rush',
    districtId: 'coast-city',
    homeLabel: 'Forensics Annex',
    powers: ['beam', 'synth'],
    flight: { cruiseKmh: 520, boostKmh: 3400, agility: 1.45, mass: 68 },
    energy: { staminaMax: 108, regenPerSec: 35, superCooldownSec: 13, primaryCooldownSec: 0.12 },
    smashRadius: 2.8,
    forms: [
      { id: 'scarlet', label: 'Scarlet suit', speedMul: 1, powerMul: 1, color: [0.82, 0.12, 0.1] },
      { id: 'lightning', label: 'Lightning trail', speedMul: 1.28, powerMul: 1.18, color: [0.95, 0.72, 0.15] }
    ],
    defaultFormId: 'scarlet',
    aerial: 'native'
  },
  {
    id: 'comet-surfer',
    codename: 'Comet Surfer',
    tagline: 'Board skim — cosmic ray',
    districtId: 'watchtower-annex',
    homeLabel: 'Orrery Deck',
    powers: ['beam'],
    flight: { cruiseKmh: 460, boostKmh: 2800, agility: 1.05, mass: 88 },
    energy: { staminaMax: 135, regenPerSec: 19, superCooldownSec: 20, primaryCooldownSec: 0.3 },
    smashRadius: 3.9,
    forms: [
      { id: 'silver', label: 'Silver shell', speedMul: 1, powerMul: 1.05, color: [0.72, 0.74, 0.78] },
      { id: 'cosmic', label: 'Cosmic flare', speedMul: 1.25, powerMul: 1.35, color: [0.95, 0.45, 0.2] }
    ],
    defaultFormId: 'silver',
    aerial: 'native'
  },
  {
    id: 'nova-centurion',
    codename: 'Nova Centurion',
    tagline: 'Corps velocity burst',
    districtId: 'watchtower-annex',
    homeLabel: 'Corps Berth',
    powers: ['beam', 'repulsor'],
    flight: { cruiseKmh: 450, boostKmh: 2600, agility: 1.08, mass: 82 },
    energy: { staminaMax: 120, regenPerSec: 24, superCooldownSec: 17, primaryCooldownSec: 0.24 },
    smashRadius: 3.5,
    forms: [{ id: 'helmet', label: 'Full helm', speedMul: 1, powerMul: 1, color: [0.18, 0.22, 0.75] }],
    defaultFormId: 'helmet',
    aerial: 'native'
  },
  {
    id: 'solar-envoy',
    codename: 'Solar Envoy',
    tagline: 'Cousin sun-line blast',
    districtId: 'metropolis',
    homeLabel: 'Envoy Spire',
    powers: ['beam'],
    flight: { cruiseKmh: 400, boostKmh: 2200, agility: 1.05, mass: 80 },
    energy: { staminaMax: 118, regenPerSec: 20, superCooldownSec: 19, primaryCooldownSec: 0.3 },
    smashRadius: 3.6,
    forms: [
      { id: 'cape', label: 'Cape line', speedMul: 1, powerMul: 1, color: [0.2, 0.28, 0.72] },
      { id: 'flare', label: 'Red flare', speedMul: 1.22, powerMul: 1.28, color: [0.85, 0.2, 0.15] }
    ],
    defaultFormId: 'cape',
    aerial: 'native'
  },
  {
    id: 'gamma-titan',
    codename: 'Gamma Titan',
    tagline: 'Leap-smash gamma shockwave',
    districtId: 'watchtower-annex',
    homeLabel: 'Research Wing',
    powers: ['synth', 'beam'],
    flight: { cruiseKmh: 300, boostKmh: 1650, agility: 0.65, mass: 175 },
    energy: { staminaMax: 155, regenPerSec: 28, superCooldownSec: 20, primaryCooldownSec: 0.35 },
    smashRadius: 4.8,
    forms: [
      { id: 'jade', label: 'Jade giant', speedMul: 1, powerMul: 1.15, color: [0.22, 0.62, 0.28] },
      { id: 'worldbreaker', label: 'Worldbreaker', speedMul: 0.88, powerMul: 1.55, color: [0.35, 0.48, 0.22] }
    ],
    defaultFormId: 'jade',
    aerial: 'native'
  },
  {
    id: 'flame-jet',
    codename: 'Flame Jet',
    tagline: 'Nova flame streak',
    districtId: 'stark-nexus',
    homeLabel: 'Baxter Loft',
    powers: ['beam'],
    flight: { cruiseKmh: 380, boostKmh: 2100, agility: 1.15, mass: 74 },
    energy: { staminaMax: 112, regenPerSec: 26, superCooldownSec: 15, primaryCooldownSec: 0.2 },
    smashRadius: 3.0,
    forms: [
      { id: 'blaze', label: 'Blaze', speedMul: 1, powerMul: 1, color: [0.92, 0.35, 0.08] },
      { id: 'plasma', label: 'Plasma shell', speedMul: 1.18, powerMul: 1.25, color: [0.98, 0.55, 0.15] }
    ],
    defaultFormId: 'blaze',
    aerial: 'native'
  },
  {
    id: 'wing-captain',
    codename: 'Wing Captain',
    tagline: 'Exo-wing interceptor',
    districtId: 'stark-nexus',
    homeLabel: 'Hangar Nest',
    powers: ['repulsor'],
    flight: { cruiseKmh: 340, boostKmh: 1950, agility: 1.2, mass: 98 },
    energy: { staminaMax: 105, regenPerSec: 24, superCooldownSec: 16, primaryCooldownSec: 0.22 },
    smashRadius: 2.8,
    forms: [
      { id: 'wings', label: 'Carbon wings', speedMul: 1, powerMul: 1, color: [0.62, 0.42, 0.28] },
      { id: 'redwing', label: 'Redwing assist', speedMul: 1.12, powerMul: 1.05, color: [0.72, 0.15, 0.12] }
    ],
    defaultFormId: 'wings',
    aerial: 'tech'
  },
  {
    id: 'thunder-zealot',
    codename: 'Thunder Zealot',
    tagline: 'Living lightning bolt',
    districtId: 'coast-city',
    homeLabel: 'Rock of Eternity Steps',
    powers: ['thunder'],
    flight: { cruiseKmh: 370, boostKmh: 2000, agility: 0.9, mass: 110 },
    energy: { staminaMax: 138, regenPerSec: 18, superCooldownSec: 21, primaryCooldownSec: 0.38 },
    smashRadius: 4.0,
    forms: [
      { id: 'champion', label: 'Champion', speedMul: 1, powerMul: 1.1, color: [0.85, 0.18, 0.12] },
      { id: 'mythic', label: 'Mythic', speedMul: 1.08, powerMul: 1.3, color: [0.95, 0.82, 0.25] }
    ],
    defaultFormId: 'champion',
    aerial: 'native'
  },
  {
    id: 'storm-caller',
    codename: 'Storm Caller',
    tagline: 'Tempest jetstream rider',
    districtId: 'watchtower-annex',
    homeLabel: 'Weather Dome',
    powers: ['thunder', 'beam'],
    flight: { cruiseKmh: 400, boostKmh: 2300, agility: 1.08, mass: 82 },
    energy: { staminaMax: 125, regenPerSec: 24, superCooldownSec: 17, primaryCooldownSec: 0.26 },
    smashRadius: 3.5,
    forms: [
      { id: 'ororo', label: 'White queen', speedMul: 1, powerMul: 1, color: [0.95, 0.95, 0.98] },
      { id: 'goddess', label: 'Goddess mode', speedMul: 1.15, powerMul: 1.35, color: [0.12, 0.15, 0.22] }
    ],
    defaultFormId: 'ororo',
    aerial: 'native'
  },
  {
    id: 'sorcerer-apex',
    codename: 'Sorcerer Apex',
    tagline: 'Crimson mantle levitation',
    districtId: 'gotham-nights',
    homeLabel: 'Sanctum Loft',
    powers: ['telekinesis', 'beam'],
    flight: { cruiseKmh: 370, boostKmh: 2100, agility: 1.05, mass: 86 },
    energy: { staminaMax: 140, regenPerSec: 22, superCooldownSec: 18, primaryCooldownSec: 0.28 },
    smashRadius: 3.3,
    forms: [
      { id: 'cloak', label: 'Cloak of levitation', speedMul: 1, powerMul: 1.05, color: [0.15, 0.12, 0.18] },
      { id: 'time', label: 'Time-split', speedMul: 1.12, powerMul: 1.25, color: [0.75, 0.12, 0.12] }
    ],
    defaultFormId: 'cloak',
    aerial: 'native'
  },
  {
    id: 'sky-tyrant',
    codename: 'Sky Tyrant',
    tagline: 'Nth-wing shock ram',
    districtId: 'asgard-embassy',
    homeLabel: 'Reincarnation Spire',
    powers: ['beam'],
    flight: { cruiseKmh: 390, boostKmh: 2050, agility: 1.0, mass: 95 },
    energy: { staminaMax: 118, regenPerSec: 20, superCooldownSec: 19, primaryCooldownSec: 0.3 },
    smashRadius: 3.4,
    forms: [
      { id: 'bronze', label: 'Bronze harness', speedMul: 1, powerMul: 1, color: [0.55, 0.38, 0.18] },
      { id: 'hawk', label: 'Predator dive', speedMul: 1.18, powerMul: 1.15, color: [0.72, 0.52, 0.22] }
    ],
    defaultFormId: 'bronze',
    aerial: 'native'
  },
  {
    id: 'phoenix-ember',
    codename: 'Phoenix Ember',
    tagline: 'Telekinetic cosmic flare',
    districtId: 'watchtower-annex',
    homeLabel: 'X-Jet Pad',
    powers: ['telekinesis', 'beam'],
    flight: { cruiseKmh: 420, boostKmh: 2500, agility: 1.02, mass: 84 },
    energy: { staminaMax: 132, regenPerSec: 23, superCooldownSec: 16, primaryCooldownSec: 0.24 },
    smashRadius: 3.6,
    forms: [
      { id: 'jean', label: 'Resonance', speedMul: 1, powerMul: 1, color: [0.18, 0.22, 0.65] },
      { id: 'phoenix', label: 'Phoenix', speedMul: 1.22, powerMul: 1.45, color: [0.92, 0.42, 0.12] }
    ],
    defaultFormId: 'jean',
    aerial: 'native'
  },
  {
    id: 'wing-archon',
    codename: 'Wing Archon',
    tagline: 'Metal pinion dive',
    districtId: 'stark-nexus',
    homeLabel: 'Mansion Aviary',
    powers: ['beam', 'optic'],
    flight: { cruiseKmh: 410, boostKmh: 2200, agility: 1.18, mass: 78 },
    energy: { staminaMax: 115, regenPerSec: 26, superCooldownSec: 15, primaryCooldownSec: 0.2 },
    smashRadius: 3.0,
    forms: [
      { id: 'feather', label: 'Feathered', speedMul: 1.05, powerMul: 0.95, color: [0.92, 0.88, 0.75] },
      { id: 'metal', label: 'Metal wings', speedMul: 1.1, powerMul: 1.2, color: [0.55, 0.58, 0.62] }
    ],
    defaultFormId: 'feather',
    aerial: 'native'
  },
  {
    id: 'golden-sentry',
    codename: 'Golden Sentry',
    tagline: 'Void-touched golden zenith',
    districtId: 'watchtower-annex',
    homeLabel: 'Helicarrier Crown',
    powers: ['beam', 'telekinesis'],
    flight: { cruiseKmh: 440, boostKmh: 2550, agility: 1.05, mass: 90 },
    energy: { staminaMax: 148, regenPerSec: 26, superCooldownSec: 15, primaryCooldownSec: 0.28 },
    smashRadius: 4.2,
    forms: [
      { id: 'hero', label: 'Golden hero', speedMul: 1, powerMul: 1.2, color: [0.92, 0.82, 0.35] },
      { id: 'void', label: 'Void whisper', speedMul: 1.15, powerMul: 1.45, color: [0.12, 0.1, 0.14] }
    ],
    defaultFormId: 'hero',
    aerial: 'native'
  },
  {
    id: 'magnet-sovereign',
    codename: 'Magnet Sovereign',
    tagline: 'Magnetic field supremacy',
    districtId: 'sokovia-memorial',
    homeLabel: 'Sentinel Memorial',
    powers: ['telekinesis', 'beam'],
    flight: { cruiseKmh: 360, boostKmh: 2000, agility: 0.95, mass: 100 },
    energy: { staminaMax: 130, regenPerSec: 22, superCooldownSec: 18, primaryCooldownSec: 0.3 },
    smashRadius: 3.7,
    forms: [
      { id: 'helmet', label: 'Crimson helmet', speedMul: 1, powerMul: 1.1, color: [0.72, 0.12, 0.15] },
      { id: 'master', label: 'Master of magnetism', speedMul: 0.95, powerMul: 1.3, color: [0.55, 0.15, 0.65] }
    ],
    defaultFormId: 'helmet',
    aerial: 'magnet'
  }
];

export function getHero(id: string): HeroSpec | undefined {
  return HERO_ROSTER.find((h) => h.id === id);
}

export const DEFAULT_HERO_ID = 'solar-apex';
