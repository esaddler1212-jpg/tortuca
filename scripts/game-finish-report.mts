#!/usr/bin/env node
/**
 * Record a game-studio slice update for Iris context (commit shared/game-finish-status.json).
 *
 * Example:
 *   npm run game-finish:report -- --agent nightshift --slice cn-d01 --status done --summary "Rep meter shipped"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type GameFinishStatusFile,
  type GameSliceStatus,
  type GameStudioAgentId,
  agentById,
  defaultGameFinishStatus,
  sliceById,
  nextPendingSlice,
} from "../shared/gameFinishProgram.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const statusPath = path.join(root, "shared/game-finish-status.json");

function usage(): never {
  console.error(
    "Usage: game-finish-report --agent nightshift|skyring --slice <id> --status pending|active|done|skipped [--summary text]",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
let agent: GameStudioAgentId | null = null;
let sliceId = "";
let status: GameSliceStatus | null = null;
let summary = "";

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--agent") agent = args[++i] as GameStudioAgentId;
  else if (a === "--slice") sliceId = args[++i] ?? "";
  else if (a === "--status") status = args[++i] as GameSliceStatus;
  else if (a === "--summary") summary = args[++i] ?? "";
}

if (!agent || !sliceId || !status) usage();
if (!agentById(agent)) usage();
const slice = sliceById(sliceId);
if (!slice || slice.agent !== agent) {
  console.error(`Slice ${sliceId} is not owned by ${agent}`);
  process.exit(1);
}

let file: GameFinishStatusFile;
if (fs.existsSync(statusPath)) {
  file = JSON.parse(fs.readFileSync(statusPath, "utf8")) as GameFinishStatusFile;
} else {
  file = defaultGameFinishStatus();
}

file.sliceState[sliceId] = {
  ...file.sliceState[sliceId],
  status,
  ...(status === "done" ? { completedAt: new Date().toISOString() } : {}),
  ...(summary ? { note: summary.slice(0, 400) } : {}),
};

file.activeSlice = { ...file.activeSlice, [agent]: sliceId };

if (status === "done") {
  const next = nextPendingSlice(agent, file);
  if (next) {
    file.activeSlice = { ...file.activeSlice, [agent]: next.id };
    file.sliceState[next.id] = { status: "active" };
  }
}

if (summary.trim()) {
  file.reports.unshift({
    agent,
    sliceId,
    at: new Date().toISOString(),
    summary: summary.trim().slice(0, 500),
  });
  file.reports = file.reports.slice(0, 40);
}

file.updatedAt = new Date().toISOString();
fs.writeFileSync(statusPath, `${JSON.stringify(file, null, 2)}\n`);
console.log(`✓ Updated ${statusPath}`);
console.log(`  ${agent} ${sliceId} → ${status}`);
if (summary) console.log(`  Iris report: ${summary.slice(0, 120)}`);
