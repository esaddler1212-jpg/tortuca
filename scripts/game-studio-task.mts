#!/usr/bin/env node
/**
 * Update VantageGames per-role tasks (Paperclip sprint board in git).
 *
 *   npm run game-studio:task -- --id cn-s3-ghost --status done --note "HUD board shipped"
 *   npm run game-studio:task -- --assignee nightshift --status active --title "..." --verify "..."
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VANTAGEGAMES_DEVELOPER_GROUP, type GameDeveloperId } from "../shared/gameStudioDevelopers.ts";
import {
  type GameStudioTaskStatus,
  type GameStudioTasksFile,
  defaultSeason3KickoffTasks,
} from "../shared/gameStudioTasks.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tasksPath = path.join(root, "shared/game-studio-tasks.json");
const DEV_IDS = new Set(VANTAGEGAMES_DEVELOPER_GROUP.map((d) => d.id));

function usage(): never {
  console.error(
    "Usage: game-studio-task --id <taskId> --status pending|active|done|blocked [--note text]\n" +
      "   or: game-studio-task --assignee <devId> --status active --title \"...\" --verify \"...\" [--doc path]",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
let id = "";
let assignee: GameDeveloperId | null = null;
let status: GameStudioTaskStatus | null = null;
let title = "";
let verify = "";
let doc = "";
let note = "";

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--id") id = args[++i] ?? "";
  else if (a === "--assignee") assignee = args[++i] as GameDeveloperId;
  else if (a === "--status") status = args[++i] as GameStudioTaskStatus;
  else if (a === "--title") title = args[++i] ?? "";
  else if (a === "--verify") verify = args[++i] ?? "";
  else if (a === "--doc") doc = args[++i] ?? "";
  else if (a === "--note") note = args[++i] ?? "";
  else if (a === "--reset-season3") {
    fs.writeFileSync(tasksPath, `${JSON.stringify(defaultSeason3KickoffTasks(new Date().toISOString()), null, 2)}\n`);
    console.log(`✓ Reset ${tasksPath} to season-3 kickoff`);
    process.exit(0);
  }
}

if (!status) usage();

let file: GameStudioTasksFile;
if (fs.existsSync(tasksPath)) {
  file = JSON.parse(fs.readFileSync(tasksPath, "utf8")) as GameStudioTasksFile;
} else {
  file = defaultSeason3KickoffTasks(new Date().toISOString());
}

const now = new Date().toISOString();

if (id) {
  const task = file.tasks.find((t) => t.id === id);
  if (!task) {
    console.error(`Unknown task id ${id}`);
    process.exit(1);
  }
  task.status = status;
  if (note) task.note = note;
  if (status === "done") task.completedAt = now;
  if (status === "active" && !task.startedAt) task.startedAt = now;
} else if (assignee && title && verify) {
  if (!DEV_IDS.has(assignee)) usage();
  for (const t of file.tasks) {
    if (t.assignee === assignee && t.status === "active") t.status = "done";
  }
  const newId = `${assignee}-${Date.now()}`;
  file.tasks.push({
    id: newId,
    assignee,
    status,
    title,
    verify,
    doc: doc || undefined,
    startedAt: status === "active" ? now : undefined,
    completedAt: status === "done" ? now : undefined,
    note: note || undefined,
  });
  id = newId;
} else {
  usage();
}

file.updatedAt = now;
fs.writeFileSync(tasksPath, `${JSON.stringify(file, null, 2)}\n`);
const t = file.tasks.find((x) => x.id === id);
console.log(`✓ Updated ${tasksPath}`);
console.log(`  ${t?.assignee} ${t?.id} → ${status}${note ? ` (${note})` : ""}`);