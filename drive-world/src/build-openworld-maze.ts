import type { AppBase } from 'playcanvas';

import type { BayQualityPreset } from './bay-quality';
import { OPENWORLD_MAZE_SIZE, fetchDefaultMazeBitmap } from './openworldjs/maze-bitmap';
import { buildMazeWallSegments } from './openworldjs/maze-wall-builder';

/** Vallejo yard meet — homage maze yard (OpenWorldJS maze.bin). */
export const OPENWORLD_MAZE_CENTER = { x: 465, z: 955 };

const CELL_M = 5;
const WALL_H = 4;
const WALL_W = 0.45;

export async function buildOpenworldCherryPickMaze(
  app: AppBase,
  preset: BayQualityPreset
): Promise<number> {
  if (preset === 'chromebook') {
    console.info('[openworld] maze skipped on Chromebook preset (perf budget)');
    return 0;
  }
  // Headless playtest (Puppeteer): hundreds of static bodies stall physics in CI.
  if (typeof navigator !== 'undefined' && navigator.webdriver) {
    console.info('[openworld] maze skipped under automation (playtest)');
    return 0;
  }
  const maze = await fetchDefaultMazeBitmap();
  buildMazeWallSegments(app, maze, {
    mazeSize: OPENWORLD_MAZE_SIZE,
    cellSizeM: CELL_M,
    wallHeightM: WALL_H,
    wallWidthM: WALL_W,
    centerX: OPENWORLD_MAZE_CENTER.x,
    centerZ: OPENWORLD_MAZE_CENTER.z
  });
  return maze.flat().filter((v) => v === 1).length;
}
