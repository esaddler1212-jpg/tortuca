/**
 * Per-role studio tasks (Paperclip issues / season backlog) — separate from finish-program slices.
 * State: `shared/game-studio-tasks.json` via `npm run game-studio:task`.
 */

import type { GameDeveloperId } from "./gameStudioDevelopers.ts";
import { gameDeveloperById } from "./gameStudioDevelopers.ts";

export type GameStudioTaskStatus = "pending" | "active" | "done" | "blocked";

export interface GameStudioTask {
  id: string;
  assignee: GameDeveloperId;
  status: GameStudioTaskStatus;
  title: string;
  /** One-line acceptance / verify */
  verify: string;
  doc?: string;
  note?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GameStudioTasksFile {
  version: 1;
  sprintId: string;
  sprintGoal: string;
  updatedAt: string;
  tasks: GameStudioTask[];
}

export function activeTaskFor(assignee: GameDeveloperId, file: GameStudioTasksFile): GameStudioTask | undefined {
  return file.tasks.find((t) => t.assignee === assignee && t.status === "active");
}

export function gameStudioTasksContextForAsk(file: GameStudioTasksFile): string {
  const active = file.tasks.filter((t) => t.status === "active");
  if (!active.length) return "";
  const lines = active.map((t) => {
    const dev = gameDeveloperById(t.assignee);
    return `${dev?.name ?? t.assignee}: ${t.title} (verify: ${t.verify})`;
  });
  return `VantageGames sprint ${file.sprintId}: ${file.sprintGoal} Active tasks: ${lines.join("; ")}.`;
}

export function defaultSeason3KickoffTasks(now: string): GameStudioTasksFile {
  return {
    version: 1,
    sprintId: "season-3-kickoff",
    sprintGoal:
      "Family couch visuals on vantagegames1 (CC0 only) + room-goal API smoke on Alfred; Trustfund prototype spec.",
    updatedAt: now,
    tasks: [
      {
        id: "wh-s3-01",
        assignee: "woodhouse",
        status: "active",
        title: "Paperclip: mirror sprint tasks; dedupe Cloud agents on bw-s3-room",
        verify: "All issues in Paperclip match shared/game-studio-tasks.json",
        doc: "docs/VANTAGEGAMES_STUDIO_DIRECTION.md",
        startedAt: now,
      },
      {
        id: "trust-s3-01",
        assignee: "nightshift",
        status: "active",
        title: "Trustfund prototype slice spec (heir wealth + City Nights heat)",
        verify: "drive-world/research/findings/*-trustfund-mvp.md",
        doc: "drive-world/research/findings/2026-11-22-son-of-a-billionaire-inspiration.md",
        startedAt: now,
      },
      {
        id: "cn-s3-ghost",
        assignee: "nightshift",
        status: "pending",
        title: "Local ghost leaderboards (top-3 per circuit, no server)",
        verify: "cd drive-world && npm run test:wiring",
        doc: "docs/CITY_NIGHTS_PEER_COMPARISON.md",
      },
      {
        id: "bw-s3-room",
        assignee: "skyring",
        status: "active",
        title: "Room-goal live POST smoke (Alfred API — first Cloud agent)",
        verify: "npm run smoke:room-goal (BATTLEWORLD_ROOM_GOAL_URL or alfred2)",
        doc: "docs/VANTAGE_GAMES_DEPLOY.md",
        startedAt: now,
      },
      {
        id: "kiln-s3-cc0",
        assignee: "kiln",
        status: "active",
        title: "CC0 hero/minis install + vantagegames1 visual findings",
        verify: "bash tools/gamedev-resources/install-free-packs.sh --hero-minis; findings/*-cc0-vantagegames1.md",
        doc: "docs/VISUAL_UPGRADE_TIERS.md",
        startedAt: now,
      },
      {
        id: "mix-s3-loud",
        assignee: "mixdown",
        status: "active",
        title: "ACE + Tokyo flight bed loudness audit (targets in doc)",
        verify: "docs/CITY_NIGHTS_CONSOLE_FEEL.md music section updated",
        startedAt: now,
      },
      {
        id: "gate-s3-couch",
        assignee: "gatekeeper",
        status: "active",
        title: "Couch pass on vantagegames1.netlify.app (boys console path)",
        verify: "drive-world/research/findings/*-couch-vantagegames1.md",
        doc: "docs/COUCH_PASS_VISUAL.md",
        startedAt: now,
      },
      {
        id: "lat-s3-wire",
        assignee: "lattice",
        status: "active",
        title: "Document two-site model: play vantagegames1 vs API alfred2",
        verify: "docs/VANTAGE_GAMES_DEPLOY.md + npm run test:vantage-production",
        startedAt: now,
      },
    ],
  };
}