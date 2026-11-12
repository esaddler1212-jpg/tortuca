import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glbPathForVillain, villainsWithBundledGlb } from "../flight-nemulator/src/villain-gltf-paths.ts";
import { glbPathForHero } from "../flight-nemulator/src/hero-gltf-paths.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const flight = path.join(root, "flight-nemulator");

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("wall-crawler hero path", glbPathForHero("wall-crawler").includes("wall-crawler.glb"));
ok(
  "wall-crawler glb on disk",
  existsSync(path.join(flight, "public", "models", "heroes", "wall-crawler.glb"))
);
ok("krypton nemesis path", glbPathForVillain("krypton-eclipse")?.includes("krypton-eclipse") === true);
ok(
  "krypton glb on disk",
  existsSync(path.join(flight, "public", "models", "villains", "krypton-eclipse.glb"))
);
ok("nemesis roster", villainsWithBundledGlb().includes("krypton-eclipse"));

if (failed) process.exitCode = 1;
else console.log("check-nemesis-glb: ok");
