/**
 * Tokyo bonus map — Midnight Club LA Remix–style post-game city, reached by flight from SFO.
 * Lives far east of the Bay (beyond far clip + fog) on its own ground slab; built lazily.
 */
import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { addHeightfieldPatch } from './build-bay-ground';
import { hash2 } from './night-palette';
import { SFO_AIRPORT_LOT } from './landmark-registry';
import type { SavedProgress } from './game-progress';
import { VEHICLE_CATALOG } from './vehicle-catalog';
import { TOKYO_FF_PARKED_CARS, isTokyoBonusVehicle } from './tokyo-ff-cars';
import type { DistrictId } from './world-config';

export const TOKYO_CENTER = { x: 9000, z: 0 } as const;
/** Driveable half-size (perimeter wall sits just outside). */
export const TOKYO_HALF_M = 820;
export const TOKYO_REWARD_VEHICLE_ID = 'tokyo-shuto-runner';

const ALL_REGIONS: DistrictId[] = ['sf', 'marin', 'eastBay', 'vallejo', 'peninsula', 'southBay'];

export type TokyoLandmark = { id: string; name: string; x: number; z: number; visitRadius: number; blurb: string };

const L = (lx: number, lz: number) => ({ x: TOKYO_CENTER.x + lx, z: TOKYO_CENTER.z + lz });

export const TOKYO_LANDMARKS: TokyoLandmark[] = [
  { id: 'tk-shibuya', name: 'Shibuya Crossing', ...L(0, 0), visitRadius: 40, blurb: 'Scramble under the big screens' },
  { id: 'tk-tokyo-tower', name: 'Tokyo Tower', ...L(240, -400), visitRadius: 55, blurb: 'Orange lattice over Minato' },
  { id: 'tk-shinjuku', name: 'Shinjuku skyline', ...L(-400, 400), visitRadius: 85, blurb: 'Kabukicho gate + supertalls' },
  { id: 'tk-ginza', name: 'Ginza clock', ...L(400, 80), visitRadius: 50, blurb: 'Wako corner, chrome storefronts' },
  { id: 'tk-akihabara', name: 'Akihabara neon', ...L(80, 560), visitRadius: 55, blurb: 'Electric Town sign wall' },
  { id: 'tk-c1', name: 'Shuto C1 loop', ...L(480, -160), visitRadius: 45, blurb: 'Orange-rail inner loop' },
  { id: 'tk-daikoku', name: 'Daikoku PA', ...L(-560, -240), visitRadius: 60, blurb: 'Fast family meet — parking-lot legends' },
  { id: 'tk-odaiba', name: 'Odaiba waterfront', ...L(720, -720), visitRadius: 70, blurb: 'Ferris wheel + Rainbow Bridge lights' }
];

/** Departure gate in the SFO lot; arrival pad at Haneda. */
/** `yaw` = car facing on arrival (+Z forward); `departYaw` / `arriveYaw` = plane heading (−Z forward). */
export const SFO_FLIGHT_GATE = {
  x: SFO_AIRPORT_LOT.x,
  z: SFO_AIRPORT_LOT.z,
  radius: 30,
  yaw: 270,
  departYaw: 90,
  arriveYaw: -90
} as const;
/** Player cars drive along local +Z, so yaw 45° faces north-east toward Shibuya. */
export const HANEDA_PAD = { ...L(-640, -640), radius: 32, yaw: 45, departYaw: 45, arriveYaw: -135 } as const;

export function isInTokyo(x: number, z: number): boolean {
  return Math.abs(x - TOKYO_CENTER.x) < TOKYO_HALF_M + 200 && Math.abs(z - TOKYO_CENTER.z) < TOKYO_HALF_M + 200;
}

/** Every Bay car (all `tokyo-*` ids excluded) + all six regions. */
export function tokyoUnlockStatus(progress: SavedProgress): {
  unlocked: boolean;
  cars: number;
  carsTotal: number;
  regions: number;
  regionsTotal: number;
} {
  const owned = new Set(progress.unlockedVehicleIds);
  const ids = Object.keys(VEHICLE_CATALOG).filter((id) => !isTokyoBonusVehicle(id));
  const cars = ids.filter((id) => owned.has(id)).length;
  const regions = ALL_REGIONS.filter((r) => progress.unlockedRegionIds.includes(r)).length;
  return {
    unlocked: cars === ids.length && regions === ALL_REGIONS.length,
    cars,
    carsTotal: ids.length,
    regions,
    regionsTotal: ALL_REGIONS.length
  };
}

export function nextTokyoLandmark(visited: string[], px: number, pz: number): TokyoLandmark | null {
  const done = new Set(visited);
  let best: TokyoLandmark | null = null;
  let bestD = Infinity;
  for (const lm of TOKYO_LANDMARKS) {
    if (done.has(lm.id)) continue;
    const d = Math.hypot(lm.x - px, lm.z - pz);
    if (d < bestD) {
      bestD = d;
      best = lm;
    }
  }
  return best;
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function mat(diffuse: [number, number, number], emissive?: [number, number, number], intensity = 0.6): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(...diffuse);
  if (emissive) {
    m.emissive = new Color(...emissive);
    m.emissiveIntensity = intensity;
  }
  m.gloss = 0.3;
  m.update();
  return m;
}

const NEON: [number, number, number][] = [
  [1, 0.15, 0.55],
  [0.1, 0.9, 1],
  [0.75, 0.3, 1],
  [1, 0.75, 0.15],
  [0.25, 1, 0.45]
];

let tokyoRoot: Entity | null = null;

export function isTokyoBuilt(): boolean {
  return tokyoRoot !== null;
}

export function setTokyoActive(on: boolean): void {
  if (tokyoRoot) tokyoRoot.enabled = on;
}

/** Same as the Bay gate pad but placed in the main world (cheap; always built). */
export function buildSfoFlightGate(app: AppBase): void {
  const gate = new Entity('sfo-tokyo-gate');
  const pad = new Entity('sfo-tokyo-gate-pad');
  pad.setLocalScale(SFO_FLIGHT_GATE.radius * 1.4, 0.06, SFO_FLIGHT_GATE.radius * 1.4);
  pad.setPosition(SFO_FLIGHT_GATE.x, 0.04, SFO_FLIGHT_GATE.z);
  pad.addComponent('render', { type: 'box', material: mat([0.06, 0.03, 0.02], [0.98, 0.42, 0.08], 0.55) });
  gate.addChild(pad);
  const sign = new Entity('sfo-tokyo-gate-sign');
  sign.setLocalScale(14, 4, 0.4);
  sign.setPosition(SFO_FLIGHT_GATE.x, 7, SFO_FLIGHT_GATE.z + SFO_FLIGHT_GATE.radius * 0.7);
  sign.addComponent('render', { type: 'box', material: mat([0.08, 0.04, 0.02], [1, 0.45, 0.1], 0.95) });
  gate.addChild(sign);
  app.root.addChild(gate);
}

export function buildTokyo(app: AppBase): void {
  if (tokyoRoot) return;
  const root = new Entity('tokyo');
  tokyoRoot = root;
  app.root.addChild(root);
  const cx = TOKYO_CENTER.x;
  const cz = TOKYO_CENTER.z;

  const add = (
    name: string,
    lx: number,
    y: number,
    lz: number,
    sx: number,
    sy: number,
    sz: number,
    material: StandardMaterial,
    collider = false,
    yawDeg = 0
  ): Entity => {
    const e = new Entity(name);
    e.setLocalScale(sx, sy, sz);
    e.setPosition(cx + lx, y, cz + lz);
    if (yawDeg) e.setEulerAngles(0, yawDeg, 0);
    e.addComponent('render', { type: 'box', material });
    if (collider) {
      e.addComponent('collision', { type: 'box', halfExtents: new Vec3(sx / 2, sy / 2, sz / 2) });
      e.addComponent('rigidbody', { type: 'static' });
    }
    root.addChild(e);
    return e;
  };

  const half = TOKYO_HALF_M + 80;
  const tokyoHeight = (wx: number, wz: number) =>
    Math.sin(wx * 0.003) * 1.1 + Math.cos(wz * 0.0025) * 0.85 + (hash2(wx * 0.15, wz * 0.15) - 0.5) * 0.7 - 0.06;
  const patch = 520;
  for (let lz = -half; lz < half; lz += patch) {
    for (let lx = -half; lx < half; lx += patch) {
      const wx = cx + lx;
      const wz = cz + lz;
      const w = Math.min(patch, half - lx);
      const d = Math.min(patch, half - lz);
      const g = mat([0.035, 0.035, 0.05]);
      addHeightfieldPatch(app, root, wx, wz, Math.max(w, d), 10, tokyoHeight, g, `tokyo-ground-${lx}-${lz}`, false);
    }
  }
  add('tokyo-ground', 0, -0.35, 0, half * 2, 0.4, half * 2, mat([0.035, 0.035, 0.05]), true);

  const wall = mat([0.08, 0.06, 0.1], [0.6, 0.2, 0.9], 0.35);
  for (const s of [-1, 1]) {
    add(`tokyo-wall-x${s}`, s * (TOKYO_HALF_M + 10), 2, 0, 4, 4, TOKYO_HALF_M * 2 + 24, wall, true);
    add(`tokyo-wall-z${s}`, 0, 2, s * (TOKYO_HALF_M + 10), TOKYO_HALF_M * 2 + 24, 4, 4, wall, true);
  }

  const asphalt = mat([0.06, 0.06, 0.07]);
  const laneLine = mat([0.3, 0.3, 0.3], [0.9, 0.9, 0.85], 0.35);
  const GRID = 160;
  const ROAD_W = 18;
  for (let k = -5; k <= 5; k++) {
    const p = k * GRID;
    add(`tokyo-road-x${k}`, p, 0.02, 0, ROAD_W, 0.04, TOKYO_HALF_M * 2, asphalt);
    add(`tokyo-road-z${k}`, 0, 0.025, p, TOKYO_HALF_M * 2, 0.04, ROAD_W, asphalt);
    add(`tokyo-lane-x${k}`, p, 0.05, 0, 0.35, 0.02, TOKYO_HALF_M * 2, laneLine);
    add(`tokyo-lane-z${k}`, 0, 0.055, p, TOKYO_HALF_M * 2, 0.02, 0.35, laneLine);
  }

  // Shuto C1 — orange rails around the ±480 ring
  const c1 = mat([0.4, 0.18, 0.04], [1, 0.45, 0.1], 0.8);
  const R = 480;
  for (const s of [-1, 1]) {
    for (const side of [-1, 1]) {
      const off = s * R + side * (ROAD_W / 2 + 0.6);
      add(`tokyo-c1-x${s}${side}`, off, 0.6, 0, 0.5, 1.2, R * 2, c1);
      add(`tokyo-c1-z${s}${side}`, 0, 0.6, off, R * 2, 1.2, 0.5, c1);
    }
  }

  const reserved = new Set([
    '240,-400', // Tokyo Tower
    '-400,400', // Shinjuku
    '400,80', // Ginza
    '80,560', // Akihabara
    '720,-720', // Odaiba
    '560,-720',
    '720,-560',
    '-560,-240', // Daikoku
    '-560,-560', // Haneda
    '-720,-560',
    '-560,-720',
    '-720,-720'
  ]);
  const towerMats = [
    mat([0.14, 0.16, 0.22], [0.3, 0.42, 0.7], 0.5),
    mat([0.18, 0.14, 0.2], [0.55, 0.36, 0.62], 0.45),
    mat([0.13, 0.16, 0.16], [0.34, 0.55, 0.55], 0.42)
  ];
  const windowBand = mat([0.3, 0.26, 0.18], [1, 0.82, 0.5], 0.75);
  const beacon = mat([0.5, 0, 0], [1, 0.08, 0.05], 1.6);
  const neonMats = NEON.map((c) => mat([c[0] * 0.2, c[1] * 0.2, c[2] * 0.2], c, 1.1));
  const rand = rng(1964);
  const inset = (GRID - ROAD_W) / 2 - 8;
  for (let i = -5; i < 5; i++) {
    for (let j = -5; j < 5; j++) {
      const ccx = i * GRID + GRID / 2;
      const ccz = j * GRID + GRID / 2;
      if (reserved.has(`${ccx},${ccz}`)) continue;
      const downtown = 1 - Math.min(1, Math.hypot(ccx, ccz) / 900);
      const n = 2 + Math.floor(rand() * 2);
      for (let t = 0; t < n; t++) {
        const w = 22 + rand() * 26;
        const d = 22 + rand() * 26;
        const h = 18 + rand() * (40 + downtown * 140);
        const ox = (rand() * 2 - 1) * (inset - w / 2);
        const oz = (rand() * 2 - 1) * (inset - d / 2);
        add(`tokyo-tower-${i}-${j}-${t}`, ccx + ox, h / 2, ccz + oz, w, h, d, towerMats[(i + j + t + 15) % 3]!, true);
        if (h > 50) {
          add(`tokyo-band-${i}-${j}-${t}`, ccx + ox, h * 0.62, ccz + oz, w + 0.4, 2.2, d + 0.4, windowBand);
        }
        if (h > 110) add(`tokyo-beacon-${i}-${j}-${t}`, ccx + ox, h + 1, ccz + oz, 1.4, 1.4, 1.4, beacon);
        if (rand() < 0.85) {
          const nm = neonMats[Math.floor(rand() * neonMats.length)]!;
          const signH = 4 + rand() * 10;
          const faceZ = rand() < 0.5;
          add(
            `tokyo-neon-${i}-${j}-${t}`,
            ccx + ox + (faceZ ? 0 : (w / 2 + 0.3) * (ox > 0 ? -1 : 1)),
            Math.min(h - signH / 2 - 1, 8 + rand() * 20),
            ccz + oz + (faceZ ? (d / 2 + 0.3) * (oz > 0 ? -1 : 1) : 0),
            faceZ ? w * 0.7 : 0.4,
            signH,
            faceZ ? 0.4 : d * 0.7,
            nm
          );
        }
      }
    }
  }

  // Shibuya scramble — zebra bands + giant screens on the corner blocks
  const zebra = mat([0.6, 0.6, 0.6], [0.85, 0.85, 0.85], 0.25);
  for (let s = -3; s <= 3; s++) {
    add(`tokyo-zebra-a${s}`, s * 2.4, 0.07, 12, 1.2, 0.02, 7, zebra);
    add(`tokyo-zebra-b${s}`, s * 2.4, 0.07, -12, 1.2, 0.02, 7, zebra);
    add(`tokyo-zebra-c${s}`, 12, 0.07, s * 2.4, 7, 0.02, 1.2, zebra);
    add(`tokyo-zebra-d${s}`, -12, 0.07, s * 2.4, 7, 0.02, 1.2, zebra);
  }
  add('tokyo-zebra-x1', 0, 0.075, 0, 1.2, 0.02, 26, zebra, false, 45);
  add('tokyo-zebra-x2', 0, 0.075, 0, 1.2, 0.02, 26, zebra, false, -45);
  const screen = neonMats[1]!;
  add('tokyo-shibuya-screen-1', 24, 22, 24, 16, 10, 0.5, screen, false, 45);
  add('tokyo-shibuya-screen-2', -24, 26, 24, 18, 11, 0.5, neonMats[0]!, false, -45);
  add('tokyo-shibuya-screen-3', 24, 18, -24, 14, 8, 0.5, neonMats[2]!, false, -45);

  // Tokyo Tower — tapered orange/white lattice stack
  const orange = mat([0.7, 0.25, 0.05], [1, 0.4, 0.1], 0.75);
  const white = mat([0.7, 0.7, 0.7], [0.9, 0.9, 0.95], 0.45);
  const tx = 240;
  const tz = -400;
  for (const [lx, lz] of [
    [-12, -12],
    [12, -12],
    [-12, 12],
    [12, 12]
  ] as const) {
    add(`tokyo-tower-leg-${lx}-${lz}`, tx + lx, 15, tz + lz, 4, 30, 4, orange, true);
  }
  for (let s = 0; s < 14; s++) {
    const w = 26 - s * 1.7;
    add(`tokyo-tower-seg-${s}`, tx, 30 + s * 9 + 4.5, tz, w, 9, w, s % 4 === 3 ? white : orange);
  }
  add('tokyo-tower-deck', tx, 70, tz, 20, 5, 20, white);
  add('tokyo-tower-spire', tx, 172, tz, 1.4, 34, 1.4, white);

  // Shinjuku — three supertalls + Kabukicho red gate
  const glass = mat([0.12, 0.16, 0.24], [0.3, 0.5, 0.85], 0.35);
  add('tokyo-shinjuku-a', -430, 120, 380, 34, 240, 34, glass, true);
  add('tokyo-shinjuku-b', -370, 95, 430, 30, 190, 30, glass, true);
  add('tokyo-shinjuku-c', -380, 80, 360, 26, 160, 26, towerMats[1]!, true);
  const red = mat([0.6, 0.05, 0.05], [1, 0.12, 0.12], 0.9);
  add('tokyo-kabukicho-l', -400 - 9, 5, 320, 1.2, 10, 1.2, red);
  add('tokyo-kabukicho-r', -400 + 9, 5, 320, 1.2, 10, 1.2, red);
  add('tokyo-kabukicho-sign', -400, 10.5, 320, 20, 3, 0.6, red);

  // Ginza — Wako clock corner
  const stone = mat([0.4, 0.38, 0.35], [0.4, 0.35, 0.3], 0.15);
  add('tokyo-ginza-wako', 400, 18, 80, 40, 36, 40, stone, true);
  add('tokyo-ginza-clock', 400, 42, 80, 12, 12, 12, mat([0.5, 0.45, 0.3], [1, 0.9, 0.6], 0.9));
  add('tokyo-ginza-strip', 400, 4, 80 + 21, 40, 5, 0.4, white);

  // Akihabara — sign wall
  for (let s = 0; s < 6; s++) {
    add(`tokyo-akiba-${s}`, 40 + s * 15, 14 + (s % 3) * 6, 560 - 40, 12, 18 + (s % 2) * 8, 0.6, neonMats[s % neonMats.length]!);
  }
  add('tokyo-akiba-block', 80, 15, 590, 110, 30, 40, towerMats[0]!, true);

  // Daikoku PA — lot, spiral ramp, parked meet cars
  const lot = mat([0.08, 0.08, 0.09], [0.2, 0.2, 0.25], 0.15);
  add('tokyo-daikoku-lot', -560, 0.06, -240, 120, 0.06, 110, lot);
  for (let s = 0; s < 18; s++) {
    const a = (s / 18) * Math.PI * 2;
    add(`tokyo-daikoku-ramp-${s}`, -560 + Math.cos(a) * 34, 3 + s * 1.2, -240 - 70 + Math.sin(a) * 34, 16, 1, 10, c1, false, (-a * 180) / Math.PI);
  }
  add('tokyo-daikoku-ff-sign', -560, 9, -255, 28, 5, 0.8, mat([0.06, 0.04, 0.08], [1, 0.45, 0.12], 0.95));
  add('tokyo-daikoku-ff-sign-2', -560, 6.2, -255, 22, 2.5, 0.5, mat([0.08, 0.1, 0.14], [0.2, 0.85, 0.95], 0.85));
  for (let s = 0; s < 10; s++) {
    const c = TOKYO_FF_PARKED_CARS[s % TOKYO_FF_PARKED_CARS.length]!;
    const body = mat([c[0] * 0.35, c[1] * 0.35, c[2] * 0.35], c, 0.72);
    add(`tokyo-daikoku-car-${s}`, -600 + s * 9, 0.7, -210, 2, 1.2, 4.4, body, true);
  }

  // Odaiba — water, Ferris wheel ring, Rainbow Bridge lights
  const water = mat([0.02, 0.05, 0.1], [0.05, 0.2, 0.45], 0.4);
  add('tokyo-water', 740, 0.01, -740, 160, 0.04, 160, water);
  for (let s = 0; s < 24; s++) {
    const a = (s / 24) * Math.PI * 2;
    add(`tokyo-wheel-${s}`, 680 + Math.cos(a) * 36, 40 + Math.sin(a) * 36, -660, 1.2, 9, 1.2, neonMats[s % neonMats.length]!, false);
  }
  add('tokyo-wheel-hub', 680, 40, -660, 4, 4, 4, white);
  add('tokyo-wheel-post', 680, 20, -660, 2, 40, 2, stone);
  for (let s = 0; s < 20; s++) {
    const t = s / 19;
    add(`tokyo-rainbow-${s}`, 600 + t * 220, 24 + Math.sin(t * Math.PI) * 14, -800, 11, 0.8, 4, white);
  }

  // Haneda — runway + pad
  const runway = mat([0.05, 0.05, 0.06], [0.15, 0.15, 0.2], 0.1);
  add('tokyo-haneda-runway', -640, 0.04, -640, 30, 0.04, 260, runway, false, 45);
  add('tokyo-haneda-pad', HANEDA_PAD.x - cx, 0.06, HANEDA_PAD.z - cz, HANEDA_PAD.radius * 1.4, 0.06, HANEDA_PAD.radius * 1.4, mat([0.04, 0.05, 0.1], [0.2, 0.6, 1], 0.55));
  for (let s = 0; s < 12; s++) {
    const t = s / 11 - 0.5;
    const along = t * 240;
    const k = Math.SQRT1_2;
    add(`tokyo-haneda-light-${s}`, -640 + along * k + 16 * k, 0.5, -640 + along * k - 16 * k, 1, 1, 1, neonMats[1]!);
  }
}
