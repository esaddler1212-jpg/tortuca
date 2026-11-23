/**
 * OpenWorldJS maze.bin decoder (bit-packed wall grid).
 * Adapted from js/game/world/mazeEngine.js — https://github.com/obecerra3/OpenWorldJS
 */

export const OPENWORLD_MAZE_SIZE = 55;

/** `1` = wall edge present between cells (same semantics as upstream maze array). */
export function decodeMazeBitmap(buffer: ArrayBuffer, mazeSize = OPENWORLD_MAZE_SIZE): number[][] {
  const byteArray = new Uint8Array(buffer);
  const maze: number[][] = [];

  byteArray.reduce((array, curr, idx) => {
    for (let i = 0; i < 8; i++) {
      const type = (curr >> (7 - i)) & 1;
      const overall = idx * 8 + i;
      if (overall % mazeSize === 0) {
        array.push([type]);
      } else {
        array[Math.floor(overall / mazeSize)]!.push(type);
      }
    }
    return array;
  }, maze);

  // maze.bin is not byte-aligned (55² bits); upstream decode may emit one partial trailing row.
  const trimmed = maze.slice(0, mazeSize).map((row) => row.slice(0, mazeSize));
  if (trimmed.length !== mazeSize) {
    throw new Error(`maze.bin decode: expected ${mazeSize} rows, got ${trimmed.length}`);
  }
  for (const row of trimmed) {
    if (row.length !== mazeSize) {
      throw new Error(`maze.bin decode: row width ${row.length} != ${mazeSize}`);
    }
  }
  return trimmed;
}

export async function fetchDefaultMazeBitmap(): Promise<number[][]> {
  const res = await fetch('./openworldjs/maze.bin');
  if (!res.ok) throw new Error(`maze.bin fetch failed (${res.status})`);
  return decodeMazeBitmap(await res.arrayBuffer());
}
