import {
  BLEND_NORMAL,
  CULLFACE_BACK,
  Color,
  Entity,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Vec3,
  type AppBase
} from 'playcanvas';
import { DISTRICTS, WORLD_HALF_M, type DistrictSpec } from './districts';
import type { QualityTier } from './quality-tier';

export type DestructibleTag = {
  entity: Entity;
  costUsd: number;
  intact: boolean;
  w: number;
  h: number;
  d: number;
  /** Home bases and landmarks — ram does not demolish */
  immune?: boolean;
};

export type BuildCityOptions = {
  tier: QualityTier;
};

const destructibles: DestructibleTag[] = [];

export function getDestructibles(): DestructibleTag[] {
  return destructibles;
}

function hash2(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function makeBoxMesh(app: AppBase, w: number, h: number, d: number): Mesh {
  const mesh = new Mesh(app.graphicsDevice);
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const positions = [
    -hw, -hh, hd, hw, -hh, hd, hw, hh, hd, -hw, hh, hd,
    -hw, -hh, -hd, -hw, hh, -hd, hw, hh, -hd, hw, -hh, -hd,
    -hw, hh, hd, hw, hh, hd, hw, hh, -hd, -hw, hh, -hd,
    -hw, -hh, hd, -hw, -hh, -hd, hw, -hh, -hd, hw, -hh, hd,
    hw, -hh, hd, hw, -hh, -hd, hw, hh, -hd, hw, hh, hd,
    -hw, -hh, hd, -hw, hh, hd, -hw, hh, -hd, -hw, -hh, -hd
  ];
  const normals = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ];
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  mesh.setPositions(positions);
  mesh.setNormals(normals);
  mesh.setIndices(indices);
  mesh.update();
  return mesh;
}

function districtAt(x: number, z: number): DistrictSpec | null {
  for (const d of DISTRICTS) {
    const dx = x - d.center.x;
    const dz = z - d.center.z;
    if (dx * dx + dz * dz <= d.radiusM * d.radiusM) return d;
  }
  return null;
}

function gridStep(tier: QualityTier): number {
  if (tier === 'low') return 88;
  if (tier === 'high') return 42;
  return 55;
}

function skipChance(tier: QualityTier): number {
  if (tier === 'low') return 0.38;
  if (tier === 'high') return 0.16;
  return 0.22;
}

export function buildMetropolis(app: AppBase, root: Entity, opts: BuildCityOptions): void {
  destructibles.length = 0;
  const step = gridStep(opts.tier);
  const skipBelow = skipChance(opts.tier);

  const ground = new Entity('ground');
  ground.setLocalScale(WORLD_HALF_M * 2, 1, WORLD_HALF_M * 2);
  ground.setLocalPosition(0, -0.5, 0);
  const gMesh = makeBoxMesh(app, WORLD_HALF_M * 2, 1, WORLD_HALF_M * 2);
  const gMat = new StandardMaterial();
  gMat.diffuse = new Color(0.08, 0.1, 0.12);
  gMat.update();
  ground.addComponent('render', { meshInstances: [new MeshInstance(gMesh, gMat)] });
  root.addChild(ground);

  for (let x = -WORLD_HALF_M + step; x < WORLD_HALF_M; x += step) {
    for (let z = -WORLD_HALF_M + step; z < WORLD_HALF_M; z += step) {
      const dist = districtAt(x, z);
      const mul = dist?.skylineMul ?? 0.65;
      const r = hash2(x, z);
      if (r < skipBelow) continue;
      const w = 18 + r * 22;
      const h = (14 + hash2(z, x) * 90) * mul;
      const d = 16 + hash2(x + z, x - z) * 20;
      const ent = new Entity(`bld-${x}-${z}`);
      ent.setLocalPosition(x, h / 2, z);
      ent.setLocalScale(w, h, d);
      const mat = new StandardMaterial();
      const accent = dist?.accent ?? [0.25, 0.28, 0.32];
      const shade = 0.85 + hash2(x * 2, z * 2) * 0.15;
      mat.diffuse = new Color(accent[0] * shade, accent[1] * shade, accent[2] * shade);
      mat.cull = CULLFACE_BACK;
      mat.blendType = BLEND_NORMAL;
      mat.update();
      const mesh = makeBoxMesh(app, 1, 1, 1);
      ent.addComponent('render', { meshInstances: [new MeshInstance(mesh, mat)] });
      root.addChild(ent);
      const cost = Math.round((w * h * d) / 80 + 50_000);
      destructibles.push({ entity: ent, costUsd: cost, intact: true, w, h, d });
    }
  }

  for (const d of DISTRICTS) {
    const home = new Entity(`home-${d.id}`);
    const towerH = 120 * d.skylineMul;
    home.setLocalPosition(d.center.x, towerH / 2, d.center.z);
    home.setLocalScale(40, towerH, 40);
    const hm = new StandardMaterial();
    hm.emissive = new Color(d.accent[0] * 0.55, d.accent[1] * 0.55, d.accent[2] * 0.55);
    hm.diffuse = new Color(d.accent[0], d.accent[1], d.accent[2]);
    hm.update();
    const mesh = makeBoxMesh(app, 1, 1, 1);
    home.addComponent('render', { meshInstances: [new MeshInstance(mesh, hm)] });
    root.addChild(home);

    const pad = new Entity(`pad-${d.id}`);
    pad.setLocalPosition(d.center.x, 0.4, d.center.z + 34);
    pad.setLocalScale(52, 0.35, 52);
    const pm = new StandardMaterial();
    pm.emissive = new Color(d.accent[0] * 0.25, d.accent[1] * 0.25, d.accent[2] * 0.25);
    pm.diffuse = new Color(0.15, 0.17, 0.2);
    pm.update();
    pad.addComponent('render', { meshInstances: [new MeshInstance(makeBoxMesh(app, 1, 1, 1), pm)] });
    root.addChild(pad);

    if (d.id === 'gotham-nights') {
      const cave = new Entity('cave-mouth');
      cave.setLocalPosition(d.center.x - 55, 12, d.center.z - 40);
      cave.setLocalScale(36, 22, 28);
      const cm = new StandardMaterial();
      cm.diffuse = new Color(0.04, 0.05, 0.08);
      cm.emissive = new Color(0.02, 0.05, 0.12);
      cm.update();
      cave.addComponent('render', { meshInstances: [new MeshInstance(makeBoxMesh(app, 1, 1, 1), cm)] });
      root.addChild(cave);
    }
  }
}

export function districtCenters(): { x: number; z: number; label: string }[] {
  return DISTRICTS.map((d) => ({ x: d.center.x, z: d.center.z, label: d.label }));
}

export function spawnSimpleCars(app: AppBase, root: Entity, count: number): Entity[] {
  const cars: Entity[] = [];
  for (let i = 0; i < count; i++) {
    const x = (hash2(i, 1) - 0.5) * WORLD_HALF_M * 1.6;
    const z = (hash2(i, 2) - 0.5) * WORLD_HALF_M * 1.6;
    const car = new Entity(`car-${i}`);
    car.setLocalPosition(x, 1.2, z);
    car.setLocalScale(4.2, 1.6, 2.2);
    const mat = new StandardMaterial();
    mat.diffuse = new Color(0.6 + hash2(i, 3) * 0.3, 0.1, 0.1);
    mat.update();
    const mesh = makeBoxMesh(app, 1, 1, 1);
    car.addComponent('render', { meshInstances: [new MeshInstance(mesh, mat)] });
    root.addChild(car);
    destructibles.push({ entity: car, costUsd: 35_000, intact: true, w: 4.2, h: 1.6, d: 2.2 });
    cars.push(car);
  }
  return cars;
}

export function nearestDistrictLabel(pos: Vec3): string {
  let best = DISTRICTS[0];
  let bd = Infinity;
  for (const d of DISTRICTS) {
    const dx = pos.x - d.center.x;
    const dz = pos.z - d.center.z;
    const dist = dx * dx + dz * dz;
    if (dist < bd) {
      bd = dist;
      best = d;
    }
  }
  return best.label;
}
