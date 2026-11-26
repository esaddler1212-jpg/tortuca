/** Active studio tasks — one active task per developer in sprint. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VANTAGEGAMES_DEVELOPER_GROUP } from "../shared/gameStudioDevelopers.ts";
import type { GameStudioTasksFile } from "../shared/gameStudioTasks.ts";
import { activeTaskFor } from "../shared/gameStudioTasks.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tasksPath = path.join(root, "shared/game-studio-tasks.json");

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("game-studio-tasks.json exists", fs.existsSync(tasksPath));
const file = JSON.parse(fs.readFileSync(tasksPath, "utf8")) as GameStudioTasksFile;
ok("sprint goal set", file.sprintGoal.length > 20);
for (const d of VANTAGEGAMES_DEVELOPER_GROUP) {
  const t = activeTaskFor(d.id, file);
  ok(`${d.id} has active task`, Boolean(t?.title && t.verify));
}
ok("bw-s3-room active for skyring", file.tasks.some((t) => t.id === "bw-s3-room" && t.status === "active"));
ok("direction doc linked", file.sprintGoal.toLowerCase().includes("vantagegames1"));

if (failed) process.exitCode = 1;
else console.log("check-game-studio-tasks: ok");