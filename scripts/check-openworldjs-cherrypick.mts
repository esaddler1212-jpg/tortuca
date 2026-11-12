import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPENWORLD_MAZE_SIZE,
  decodeMazeBitmap,
} from "../drive-world/src/openworldjs/maze-bitmap.ts";
import { snapToBayGround } from "../drive-world/src/openworldjs/ground-snap.ts";
import { CharacterAnimationState } from "../drive-world/src/openworldjs/character-animation-states.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

const mazePath = path.join(root, "drive-world/public/openworldjs/maze.bin");
ok("maze.bin present", existsSync(mazePath));
ok("genmaze tool present", existsSync(path.join(root, "tools/openworldjs/genmaze.py")));
ok("filemap doc", existsSync(path.join(root, "docs/third-party/OPENWORLDJS_FILEMAP.md")));

const mazeFile = readFileSync(mazePath);
const buf = mazeFile.buffer.slice(
  mazeFile.byteOffset,
  mazeFile.byteOffset + mazeFile.byteLength
);
const maze = decodeMazeBitmap(buf);
ok("maze decodes 55x55", maze.length === OPENWORLD_MAZE_SIZE);
ok("ground snap finite", Number.isFinite(snapToBayGround(0, 0)));
ok("anim states", CharacterAnimationState.RUN === "Run");

if (failed) process.exitCode = 1;
else console.log("check-openworldjs-cherrypick: ok");
