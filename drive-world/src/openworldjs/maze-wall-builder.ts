/**
 * Merged maze wall meshes (PlayCanvas static boxes).
 * Port of MazeEngine.build — https://github.com/obecerra3/OpenWorldJS
 */
import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from '../bay-terrain';

export type OpenworldMazeBuildOptions = {
  mazeSize: number;
  cellSizeM: number;
  wallHeightM: number;
  wallWidthM: number;
  centerX: number;
  centerZ: number;
};

const defaultWallMat = (): StandardMaterial => {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.45, 0.45, 0.48);
  m.emissive = new Color(0.12, 0.14, 0.18);
  m.emissiveIntensity = 0.35;
  m.update();
  return m;
};

function addWallSegment(
  app: AppBase,
  parent: Entity,
  mat: StandardMaterial,
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  index: number
): void {
  const wall = new Entity(`openworld-maze-wall-${index}`);
  wall.setLocalScale(sx, sy, sz);
  wall.setPosition(cx, cy, cz);
  wall.addComponent('render', { type: 'box', material: mat });
  wall.addComponent('collision', { type: 'box', halfExtents: new Vec3(sx * 0.5, sy * 0.5, sz * 0.5) });
  wall.addComponent('rigidbody', { type: 'static' });
  parent.addChild(wall);
}

export function buildMazeWallSegments(
  app: AppBase,
  maze: number[][],
  opts: OpenworldMazeBuildOptions
): Entity {
  const root = new Entity('openworld-maze');
  app.root.addChild(root);

  const mat = defaultWallMat();
  const { mazeSize, cellSizeM, wallHeightM, wallWidthM, centerX, centerZ } = opts;
  const worldMazeSize = cellSizeM * mazeSize;
  const originX = centerX - worldMazeSize / 2;
  const originZ = centerZ - worldMazeSize / 2;

  let wallIndex = 0;

  for (let i = 0; i < mazeSize; i++) {
    for (let j = 0; j < mazeSize - 1; j++) {
      if (!maze[i]![j]) continue;
      if (maze[i]![j + 1] !== 1) continue;
      let k = j + 2;
      while (k < mazeSize && maze[i]![k]) k += 1;
      const wallLength = cellSizeM * (k - j - 1) + wallWidthM;
      const wallCenterX = originX + j * cellSizeM + wallLength / 2 - wallWidthM / 2;
      const wallCenterZ = originZ + i * cellSizeM + cellSizeM / 2;
      const wallCenterY = hillOffsetM(wallCenterX, wallCenterZ) + wallHeightM / 2;
      addWallSegment(
        app,
        root,
        mat,
        wallCenterX,
        wallCenterY,
        wallCenterZ,
        wallLength,
        wallHeightM,
        wallWidthM,
        wallIndex++
      );
      j = k - 1;
    }
  }

  for (let j = 0; j < mazeSize; j++) {
    for (let i = 0; i < mazeSize - 1; i++) {
      if (!maze[i]![j]) continue;
      if (maze[i + 1]![j] !== 1) continue;
      let k = i + 2;
      while (k < mazeSize && maze[k]![j]) k += 1;
      const wallLength = cellSizeM * (k - i - 1);
      const wallCenterX = originX + j * cellSizeM + cellSizeM / 2;
      const wallCenterZ = originZ + i * cellSizeM + cellSizeM / 2 + wallLength / 2;
      const wallCenterY = hillOffsetM(wallCenterX, wallCenterZ) + wallHeightM / 2;
      addWallSegment(
        app,
        root,
        mat,
        wallCenterX,
        wallCenterY,
        wallCenterZ,
        wallWidthM,
        wallHeightM,
        wallLength,
        wallIndex++
      );
      i = k - 1;
    }
  }

  return root;
}
