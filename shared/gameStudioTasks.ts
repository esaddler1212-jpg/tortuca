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
      "First season-3 pass: ghost leaderboards, live room-goal smoke, tier-2 art audit, couch QA on preview.",
    updatedAt: now,
    tasks: [
      {
        id: "wh-s3-01",
        assignee: "woodhouse",
        status: "active",
        title: "Hold season-3 standup: one Paperclip status report per developer",
        verify: "Each role has active task; block duplicate Cloud agents on same task",
        doc: "docs/PAPERCLIP_VANTAGEGAME_STUDIO.md",
        startedAt: now,
      },
      {
        id: "cn-s3-ghost",
        assignee: "nightshift",
        status: "active",
        title: "Async ghost sprint leaderboards (local top-3 per circuit)",
        verify: "cd drive-world && npm run test:wiring; new check or playtest asserts HUD board",
        doc: "docs/CITY_NIGHTS_PEER_COMPARISON.md",
        startedAt: now,
      },
      {
        id: "bw-s3-room",
        assignee: "skyring",
        status: "active",
        title: "Room-goal live POST smoke (Netlify preview URL)",
        verify: "scripts/smoke-battleworld-room-goal.mjs against DEPLOY_PRIME_URL",
        doc: "docs/BROWSER_VISUAL_DEPLOY.md",
        startedAt: now,
      },
      {
        id: "kiln-s3-tier2",
        assignee: "kiln",
        status: "active",
        title: "Tier-2 visual gap audit (City Nights + Battleworld)",
        verify: "drive-world/research/findings/*-tier2-visual.md committed",
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
        title: "Couch pass on main Netlify preview (City Nights + Battleworld hub)",
        verify: "drive-world/research/findings/*-couch-season3.md",
        doc: "docs/COUCH_PASS_VISUAL.md",
        startedAt: now,
      },
      {
        id: "lat-s3-wire",
        assignee: "lattice",
        status: "active",
        title: "Document preview env vars for room-goal + lattice POST smoke",
        verify: "docs/BROWSER_VISUAL_DEPLOY.md env table + npm run test:vantage-production",
        startedAt: now,
      },
    ],
  };
}