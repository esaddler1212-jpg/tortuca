/**
 * Low-poly Blockbench-style pilot mesh for tin-aviator (CC0 first-party).
 * Run: node scripts/build-tin-aviator-glb.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, '..', 'public', 'models', 'heroes', 'tin-aviator.glb');

// Unit-scale humanoid: torso + head + arms (merged mesh, ~24 tris).
const positions = new Float32Array([
  // torso box 0.5 x 0.9 x 0.28
  -0.25, 0.55, -0.14, 0.25, 0.55, -0.14, 0.25, 1.45, -0.14, -0.25, 1.45, -0.14,
  -0.25, 0.55, 0.14, 0.25, 0.55, 0.14, 0.25, 1.45, 0.14, -0.25, 1.45, 0.14,
  // head 0.32 cube centered ~1.62
  -0.16, 1.46, -0.16, 0.16, 1.46, -0.16, 0.16, 1.78, -0.16, -0.16, 1.78, -0.16,
  -0.16, 1.46, 0.16, 0.16, 1.46, 0.16, 0.16, 1.78, 0.16, -0.16, 1.78, 0.16
]);

const indices = new Uint16Array([
  ...boxIndices(0),
  ...boxIndices(8)
]);

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

const bin = Buffer.concat([Buffer.from(positions.buffer), Buffer.from(indices.buffer)]);
const posMin = [-0.25, 0.55, -0.16];
const posMax = [0.25, 1.78, 0.16];

const gltf = {
  asset: { version: '2.0', generator: 'tortuca-build-tin-aviator' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'tin-aviator' }],
  meshes: [
    {
      primitives: [
        {
          attributes: { POSITION: 0 },
          indices: 1,
          mode: 4
        }
      ]
    }
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: positions.length / 3,
      type: 'VEC3',
      min: posMin,
      max: posMax
    },
    {
      bufferView: 1,
      componentType: 5123,
      count: indices.length,
      type: 'SCALAR'
    }
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 },
    {
      buffer: 0,
      byteOffset: positions.byteLength,
      byteLength: indices.byteLength,
      target: 34963
    }
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

writeFileSync(out, Buffer.concat([header, jsonLen, jsonChunk, binLen, binChunk]));
console.log(`wrote ${out} (${total} bytes)`);
