/**
 * VantageGames finish program — day-sized slices + game-studio agents that report to Iris.
 * Status lives in shared/game-finish-status.json (updated via scripts/game-finish-report.mts).
 */

export type GameStudioAgentId = "nightshift" | "skyring";

export interface GameStudioAgent {
  id: GameStudioAgentId;
  name: string;
  game: "city-nights" | "battleworld";
  path: string;
  /** Iris hears this agent as reporting to Woodhouse / Team ops, then Iris relays to E. */
  reportsTo: "iris-via-woodhouse";
}

export const GAME_STUDIO_AGENTS: GameStudioAgent[] = [
  {
    id: "nightshift",
    name: "Nightshift",
    game: "city-nights",
    path: "drive-world/",
    reportsTo: "iris-via-woodhouse",
  },
  {
    id: "skyring",
    name: "Skyring",
    game: "battleworld",
    path: "flight-nemulator/",
    reportsTo: "iris-via-woodhouse",
  },
];

export type GameSliceStatus = "pending" | "active" | "done" | "skipped";

export interface GameSliceDef {
  id: string;
  day: number;
  title: string;
  agent: GameStudioAgentId;
  game: "city-nights" | "battleworld";
  verify: string;
  doc?: string;
}

/** ~10 engineering days per game (one primary slice per agent per day). */
export const GAME_FINISH_SLICES: GameSliceDef[] = [
  // City Nights — MC / FH progression
  {
    id: "cn-d01",
    day: 1,
    title: "Street rep meter (region % → rank)",
    agent: "nightshift",
    game: "city-nights",
    verify: "HUD shows rep; save persists",
    doc: "docs/CITY_NIGHTS_PEER_COMPARISON.md",
  },
  {
    id: "cn-d02",
    day: 2,
    title: "Ghost sprint 1 (freeway segment + PB toast)",
    agent: "nightshift",
    game: "city-nights",
    verify: "Finish line + personal best",
  },
  {
    id: "cn-d03",
    day: 3,
    title: "Nitro Zone post-FX + FOV punch",
    agent: "nightshift",
    game: "city-nights",
    verify: "Nitro reads like MC Zone on Lush",
    doc: "docs/CITY_NIGHTS_FEEL.md",
  },
  {
    id: "cn-d04",
    day: 4,
    title: "Ghost sprints 2–3 + circuit roster stub",
    agent: "nightshift",
    game: "city-nights",
    verify: "3 marked routes on map",
  },
  {
    id: "cn-d05",
    day: 5,
    title: "Freeway traffic drones (main arteries)",
    agent: "nightshift",
    game: "city-nights",
    verify: "Chromebook preset still playable",
  },
  {
    id: "cn-d06",
    day: 6,
    title: "Perf pass: draw calls / hub hitch",
    agent: "nightshift",
    game: "city-nights",
    verify: "npm run test:smoke in drive-world",
    doc: "docs/DRIVE_WORLD_STATUS.md",
  },
  {
    id: "cn-d07",
    day: 7,
    title: "Photo orbit + exposure slider",
    agent: "nightshift",
    game: "city-nights",
    verify: "Photo mode exits cleanly",
  },
  {
    id: "cn-d08",
    day: 8,
    title: "Heat-5 cop box (solo chase)",
    agent: "nightshift",
    game: "city-nights",
    verify: "Spawn + escape loop",
  },
  {
    id: "cn-d09",
    day: 9,
    title: "One ACE-Step / playlist bed swap",
    agent: "nightshift",
    game: "city-nights",
    verify: "Settings → playlist plays new bed",
    doc: "docs/CITY_NIGHTS_PLAYBOOK.md",
  },
  {
    id: "cn-d10",
    day: 10,
    title: "15-minute funnel QA + couch gamepad pass",
    agent: "nightshift",
    game: "city-nights",
    verify: "docs/GAME_FINISH_PROGRAM.md funnel signed off",
    doc: "docs/CITY_NIGHTS_CONSOLE_FEEL.md",
  },
  // Battleworld — look + campaign
  {
    id: "bw-d01",
    day: 1,
    title: "District universe rims + sky read",
    agent: "skyring",
    game: "battleworld",
    verify: "Nine districts distinct from orbit",
    doc: "docs/FLIGHT_NEMULATOR.md",
  },
  {
    id: "bw-d02",
    day: 2,
    title: "Hero GLB pipeline hero #2 (signature pick)",
    agent: "skyring",
    game: "battleworld",
    verify: "npm run build:hero-glb + in-game mesh",
  },
  {
    id: "bw-d03",
    day: 3,
    title: "Chapter chain 1–3 (objectives + HUD)",
    agent: "skyring",
    game: "battleworld",
    verify: "battleworld-chapters progress",
  },
  {
    id: "bw-d04",
    day: 4,
    title: "Wave-10 combat juice pass",
    agent: "skyring",
    game: "battleworld",
    verify: "Pair boss + shake/HUD chip",
  },
  {
    id: "bw-d05",
    day: 5,
    title: "Hero GLB #3 + nemesis GLB #1",
    agent: "skyring",
    game: "battleworld",
    verify: "Roster spawn uses glb when present",
  },
  {
    id: "bw-d06",
    day: 6,
    title: "Tier-A X-Men slice (one arc beat)",
    agent: "skyring",
    game: "battleworld",
    verify: "test:flight-nemulator green",
    doc: "docs/FLIGHT_NEMULATOR_XMEN_RESEARCH.md",
  },
  {
    id: "bw-d07",
    day: 7,
    title: "Offline autosave clarity (VantageGames)",
    agent: "skyring",
    game: "battleworld",
    verify: "vantagegames1 bundle; lattice optional",
    doc: "docs/VANTAGE_GAMES_DEPLOY.md",
  },
  {
    id: "bw-d08",
    day: 8,
    title: "Dialogue/cutscene beat on chapter clear",
    agent: "skyring",
    game: "battleworld",
    verify: "battleworld-dialogue check",
  },
  {
    id: "bw-d09",
    day: 9,
    title: "Minimap + arc chip readability",
    agent: "skyring",
    game: "battleworld",
    verify: "New player finds home H",
  },
  {
    id: "bw-d10",
    day: 10,
    title: "15-minute funnel QA (hero pick → territory)",
    agent: "skyring",
    game: "battleworld",
    verify: "Smoke boot + manual pass",
  },
];

export interface GameFinishReport {
  agent: GameStudioAgentId;
  sliceId: string;
  at: string;
  summary: string;
}

export interface GameFinishStatusFile {
  version: 1;
  updatedAt: string;
  activeSlice?: { nightshift?: string; skyring?: string };
  sliceState: Record<string, { status: GameSliceStatus; completedAt?: string; note?: string }>;
  reports: GameFinishReport[];
}

const SLICE_BY_ID = new Map(GAME_FINISH_SLICES.map((s) => [s.id, s]));
const AGENT_BY_ID = new Map(GAME_STUDIO_AGENTS.map((a) => [a.id, a]));

export function sliceById(id: string): GameSliceDef | undefined {
  return SLICE_BY_ID.get(id);
}

export function agentById(id: string): GameStudioAgent | undefined {
  return AGENT_BY_ID.get(id as GameStudioAgentId);
}

export function defaultGameFinishStatus(): GameFinishStatusFile {
  const sliceState: GameFinishStatusFile["sliceState"] = {};
  for (const s of GAME_FINISH_SLICES) {
    sliceState[s.id] = { status: "pending" };
  }
  sliceState["cn-d01"].status = "active";
  sliceState["bw-d01"].status = "active";
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    activeSlice: { nightshift: "cn-d01", skyring: "bw-d01" },
    sliceState,
    reports: [],
  };
}

export function nextPendingSlice(agent: GameStudioAgentId, status: GameFinishStatusFile): GameSliceDef | undefined {
  return GAME_FINISH_SLICES.find(
    (s) => s.agent === agent && (status.sliceState[s.id]?.status ?? "pending") === "pending",
  );
}

function countDone(agent: GameStudioAgentId, status: GameFinishStatusFile): number {
  return GAME_FINISH_SLICES.filter(
    (s) => s.agent === agent && status.sliceState[s.id]?.status === "done",
  ).length;
}

function totalForAgent(agent: GameStudioAgentId): number {
  return GAME_FINISH_SLICES.filter((s) => s.agent === agent).length;
}

/** One line in Iris "Right now" — no student/game PII. */
export function gameFinishContextForAsk(status: GameFinishStatusFile): string {
  const cnDone = countDone("nightshift", status);
  const bwDone = countDone("skyring", status);
  const cnTotal = totalForAgent("nightshift");
  const bwTotal = totalForAgent("skyring");
  const nextN = nextPendingSlice("nightshift", status);
  const nextS = nextPendingSlice("skyring", status);
  const lastReports = status.reports
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 2)
    .map((r) => {
      const a = agentById(r.agent);
      return `${a?.name ?? r.agent} (${r.sliceId}): ${r.summary.slice(0, 120)}`;
    });

  const parts = [
    `VantageGames finish program (game studio reports to Iris via Team): Nightshift City Nights ${cnDone}/${cnTotal} done${nextN ? `, next ${nextN.id} ${nextN.title}` : ""}; Skyring Battleworld ${bwDone}/${bwTotal} done${nextS ? `, next ${nextS.id} ${nextS.title}` : ""}.`,
  ];
  if (lastReports.length) parts.push(`Latest game-studio reports: ${lastReports.join("; ")}.`);
  return parts.join(" ");
}

/** Team panel blurb */
export function gameFinishTeamBlurb(status: GameFinishStatusFile): string {
  const cn = countDone("nightshift", status);
  const bw = countDone("skyring", status);
  return `Nightshift ${cn}/10 · Skyring ${bw}/10 — see docs/GAME_FINISH_PROGRAM.md`;
}
