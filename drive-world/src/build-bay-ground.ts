import {
  Color,
  Entity,
  Mesh,
  MeshInstance,
  PRIMITIVE_TRIANGLES,
  StandardMaterial,
  Vec3,
  calculateNormals,
  type AppBase
} from 'playcanvas';

import type { BayQualityPreset } from './bay-quality';
import { hillOffsetM } from './bay-terrain';
import { hash2 } from './night-palette';
import { inBayWater } from './street-utils';
import { DISTRICTS, type DistrictId, WORLD_HALF_M } from './world-config';

function terrainLod(preset: BayQualityPreset): { chunkM: number; segs: number } {
  if (preset === 'chromebook') return { chunkM: 520, segs: 6 };
  if (preset === 'lush') return { chunkM: 400, segs: 14 };
  return { chunkM: 440, segs: 10 };
}

function districtAt(x: number, z: number): DistrictId | null {
  for (const id of Object.keys(DISTRICTS) as DistrictId[]) {
    const d = DISTRICTS[id];
    if (x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ) return id;
  }
  return null;
}

/** Night dirt / asphalt shoulder tone per region — subtle so streets read on top. */
function groundDiffuse(x: number, z: number): Color {
  const id = districtAt(x, z);
  const n = (hash2(x * 0.07, z * 0.07) - 0.5) * 0.02;
  switch (id) {
    case 'sf':
      return new Color(0.055 + n, 0.05 + n, 0.048);
    case 'marin':
      return new Color(0.04 + n, 0.055 + n, 0.042);
    case 'peninsula':
      return new Color(0.048 + n, 0.05 + n, 0.045);
    case 'southBay':
      return new Color(0.05 + n, 0.052 + n, 0.05);
    case 'eastBay':
      return new Color(0.052 + n, 0.048 + n, 0.046);
    case 'vallejo':
      return new Color(0.058 + n, 0.05 + n, 0.044);
    default:
      return new Color(0.042 + n, 0.044 + n, 0.046);
  }
}

function heightAt(x: number, z: number): number {
  if (inBayWater(x, z)) return -2.8;
  return hillOffsetM(x, z) - 0.12;
}

function chunkUnderwater(minX: number, minZ: number, size: number): boolean {
  const pts: [number, number][] = [
    [minX, minZ],
    [minX + size, minZ],
    [minX, minZ + size],
    [minX + size, minZ + size],
    [minX + size * 0.5, minZ + size * 0.5]
  ];
  return pts.every(([x, z]) => inBayWater(x, z));
}

export function addHeightfieldPatch(
  app: AppBase,
  parent: Entity,
  minX: number,
  minZ: number,
  size: number,
  segs: number,
  heightFn: (x: number, z: number) => number,
  material: StandardMaterial,
  entityName: string,
  collider = true
): void {
  const { mesh } = buildChunkMesh(app, minX, minZ, size, segs, heightFn);
  const mi = new MeshInstance(mesh, material);
  const ent = new Entity(entityName);
  ent.addComponent('render', { meshInstances: [mi] });
  parent.addChild(ent);
}

function buildChunkMesh(
  app: AppBase,
  minX: number,
  minZ: number,
  size: number,
  segs: number,
  heightFn: (x: number, z: number) => number
): { mesh: Mesh; minY: number; maxY: number } {
  const verts = segs + 1;
  const positions = new Float32Array(verts * verts * 3);
  const uvs = new Float32Array(verts * verts * 2);
  let minY = Infinity;
  let maxY = -Infinity;
  let pi = 0;
  let ui = 0;
  for (let iz = 0; iz < verts; iz++) {
    for (let ix = 0; ix < verts; ix++) {
      const tx = ix / segs;
      const tz = iz / segs;
      const wx = minX + tx * size;
      const wz = minZ + tz * size;
      const h = heightFn(wx, wz);
      minY = Math.min(minY, h);
      maxY = Math.max(maxY, h);
      positions[pi++] = wx;
      positions[pi++] = h;
      positions[pi++] = wz;
      uvs[ui++] = tx;
      uvs[ui++] = tz;
    }
  }

  const indices: number[] = [];
  for (let iz = 0; iz < segs; iz++) {
    for (let ix = 0; ix < segs; ix++) {
      const a = iz * verts + ix;
      const b = a + 1;
      const c = a + verts;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const mesh = new Mesh(app.graphicsDevice);
  mesh.setPositions(positions);
  mesh.setNormals(calculateNormals(positions, indices));
  mesh.setUvs(0, uvs);
  mesh.setIndices(indices);
  mesh.update(PRIMITIVE_TRIANGLES);
  return { mesh, minY, maxY };
}

/**
 * Heightmapped Bay ground (replaces the flat collision slab). Streets / freeways still sit on
 * `hillOffsetM` — this mesh fills the gaps and gives SF/Marin grade you can see at night.
 */
export function buildBayGround(app: AppBase, preset: BayQualityPreset = 'balanced'): void {
  const { chunkM, segs } = terrainLod(preset);
  const half = WORLD_HALF_M;
  const root = new Entity('bay-terrain-root');
  app.root.addChild(root);

  for (let z = -half; z < half; z += chunkM) {
    for (let x = -half; x < half; x += chunkM) {
      if (chunkUnderwater(x, z, chunkM)) continue;

      const cx = x + chunkM * 0.5;
      const cz = z + chunkM * 0.5;
      const mat = new StandardMaterial();
      mat.diffuse = groundDiffuse(cx, cz);
      mat.gloss = 0.18;
      mat.metalness = 0.04;
      mat.update();

      addHeightfieldPatch(app, root, x, z, chunkM, segs, heightAt, mat, `bay-terrain-${Math.round(x)}-${Math.round(z)}`, false);
    }
  }

  // Physics slab (flat) — streets/freeways still carry most driving; terrain mesh is visual fill.
  const ground = new Entity('ground');
  ground.setLocalScale(half * 2, 0.4, half * 2);
  ground.setPosition(0, -0.35, 0);
  ground.addComponent('collision', { type: 'box', halfExtents: new Vec3(half, 0.2, half) });
  ground.addComponent('rigidbody', { type: 'static' });
  root.addChild(ground);
}
