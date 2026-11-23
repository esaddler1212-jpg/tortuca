/**
 * Procedural homage hero GLBs (Blockbench-style, CC0 first-party).
 * Run: node scripts/build-hero-glbs.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const heroesDir = join(root, '..', 'public', 'models', 'heroes');

function boxIndices(base) {
  return [
    base + 0, base + 1, base + 2, base + 0, base + 2, base + 3,
    base + 4, base + 6, base + 5, base + 4, base + 7, base + 6,
    base + 0, base + 4, base + 5, base + 0, base + 5, base + 1,
    base + 2, base + 6, base + 7, base + 2, base + 7, base + 3,
    base + 0, base + 3, base + 7, base + 0, base + 7, base + 4,
    base + 1, base + 5, base + 6, base + 1, base + 6, base + 2
  ];
}

function writeGlb(outPath, nodeName, positions, indices, posMin, posMax) {
  const bin = Buffer.concat([Buffer.from(positions.buffer), Buffer.from(indices.buffer)]);
  const gltf = {
    asset: { version: '2.0', generator: 'tortuca-build-hero-glbs' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: nodeName }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: 'VEC3',
        min: posMin,
        max: posMax
      },
      { bufferView: 1, componentType: 5123, count: indices.length, type: 'SCALAR' }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength, target: 34963 }
    ],
    buffers: [{ byteLength: bin.length }]
  };

  const json = Buffer.from(JSON.stringify(gltf));
  const jsonPad = (4 - (json.length % 4)) % 4;
  const binPad = (4 - (bin.length % 4)) % 4;
  const jsonChunk = Buffer.concat([json, Buffer.alloc(jsonPad, 0x20)]);
  const binChunk = Buffer.concat([bin, Buffer.alloc(binPad)]);

  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);

  const jsonLen = Buffer.alloc(8);
  jsonLen.writeUInt32LE(jsonChunk.length, 0);
  jsonLen.writeUInt32LE(0x4e4f534a, 4);

  const binLen = Buffer.alloc(8);
  binLen.writeUInt32LE(binChunk.length, 0);
  binLen.writeUInt32LE(0x004e4942, 4);

  writeFileSync(outPath, Buffer.concat([header, jsonLen, jsonChunk, binLen, binChunk]));
  console.log(`wrote ${outPath} (${total} bytes)`);
}

// tin-aviator — slim pilot
{
  const positions = new Float32Array([
    -0.25, 0.55, -0.14, 0.25, 0.55, -0.14, 0.25, 1.45, -0.14, -0.25, 1.45, -0.14,
    -0.25, 0.55, 0.14, 0.25, 0.55, 0.14, 0.25, 1.45, 0.14, -0.25, 1.45, 0.14,
    -0.16, 1.46, -0.16, 0.16, 1.46, -0.16, 0.16, 1.78, -0.16, -0.16, 1.78, -0.16,
    -0.16, 1.46, 0.16, 0.16, 1.46, 0.16, 0.16, 1.78, 0.16, -0.16, 1.78, 0.16
  ]);
  const indices = new Uint16Array([...boxIndices(0), ...boxIndices(8)]);
  writeGlb(
    join(heroesDir, 'tin-aviator.glb'),
    'tin-aviator',
    positions,
    indices,
    [-0.25, 0.55, -0.16],
    [0.25, 1.78, 0.16]
  );
}

// solar-apex — wider shoulders + crest (default roster hero)
{
  const positions = new Float32Array([
    -0.38, 0.55, -0.2, 0.38, 0.55, -0.2, 0.38, 1.48, -0.2, -0.38, 1.48, -0.2,
    -0.38, 0.55, 0.2, 0.38, 0.55, 0.2, 0.38, 1.48, 0.2, -0.38, 1.48, 0.2,
    -0.2, 1.5, -0.18, 0.2, 1.5, -0.18, 0.2, 1.86, -0.18, -0.2, 1.86, -0.18,
    -0.2, 1.5, 0.18, 0.2, 1.5, 0.18, 0.2, 1.86, 0.18, -0.2, 1.86, 0.18,
    -0.55, 1.05, -0.12, 0.55, 1.05, -0.12, 0.55, 1.35, -0.12, -0.55, 1.35, -0.12,
    -0.55, 1.05, 0.12, 0.55, 1.05, 0.12, 0.55, 1.35, 0.12, -0.55, 1.35, 0.12
  ]);
  const indices = new Uint16Array([
    ...boxIndices(0),
    ...boxIndices(8),
    ...boxIndices(16)
  ]);
  writeGlb(
    join(heroesDir, 'solar-apex.glb'),
    'solar-apex',
    positions,
    indices,
    [-0.55, 0.55, -0.2],
    [0.55, 1.86, 0.2]
  );
}

// wall-crawler — lanky hero (GLB #3)
{
  const positions = new Float32Array([
    -0.22, 0.5, -0.12, 0.22, 0.5, -0.12, 0.22, 1.62, -0.12, -0.22, 1.62, -0.12,
    -0.22, 0.5, 0.12, 0.22, 0.5, 0.12, 0.22, 1.62, 0.12, -0.22, 1.62, 0.12,
    -0.14, 1.64, -0.1, 0.14, 1.64, -0.1, 0.14, 1.92, -0.1, -0.14, 1.92, -0.1,
    -0.14, 1.64, 0.1, 0.14, 1.64, 0.1, 0.14, 1.92, 0.1, -0.14, 1.92, 0.1,
    -0.38, 0.2, -0.08, -0.12, 0.2, -0.08, -0.12, 1.05, -0.08, -0.38, 1.05, -0.08,
    -0.38, 0.2, 0.08, -0.12, 0.2, 0.08, -0.12, 1.05, 0.08, -0.38, 1.05, 0.08,
    0.12, 0.2, -0.08, 0.38, 0.2, -0.08, 0.38, 1.05, -0.08, 0.12, 1.05, -0.08,
    0.12, 0.2, 0.08, 0.38, 0.2, 0.08, 0.38, 1.05, 0.08, 0.12, 1.05, 0.08
  ]);
  const indices = new Uint16Array([
    ...boxIndices(0),
    ...boxIndices(8),
    ...boxIndices(16),
    ...boxIndices(24),
    ...boxIndices(32)
  ]);
  writeGlb(
    join(heroesDir, 'wall-crawler.glb'),
    'wall-crawler',
    positions,
    indices,
    [-0.38, 0.2, -0.12],
    [0.38, 1.92, 0.12]
  );
}
