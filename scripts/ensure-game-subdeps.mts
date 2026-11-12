/** Install playcanvas subproject deps when missing (CI / fresh clones). */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const sub of ["flight-nemulator", "drive-world"]) {
  const dir = path.join(root, sub);
  const pkg = path.join(dir, "package.json");
  const pc = path.join(dir, "node_modules", "playcanvas");
  if (!existsSync(pkg) || existsSync(pc)) continue;
  const r = spawnSync("npm", ["ci"], { cwd: dir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("ensure-game-subdeps: ok");
