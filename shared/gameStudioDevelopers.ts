/**
 * VantageGames developer group — org + responsibilities (Paperclip-style reports).
 * Slice owners remain `nightshift` | `skyring` in gameFinishProgram.ts; this roster is the full studio.
 *
 * Paperclip alignment: `reportsTo` chain + responsibility status reports
 * (`on_track` | `at_risk` | `behind` | `unknown`, one-line `message`) — see
 * docs/PAPERCLIP_VANTAGEGAME_STUDIO.md and packages/shared responsibility-status-reports in Paperclip.
 */

export const RESPONSIBILITY_STATUS_REPORT_STATUSES = [
  "on_track",
  "at_risk",
  "behind",
  "unknown",
] as const;

export type ResponsibilityStatusReportStatus = (typeof RESPONSIBILITY_STATUS_REPORT_STATUSES)[number];

export type GameDeveloperId =
  | "woodhouse"
  | "nightshift"
  | "skyring"
  | "kiln"
  | "mixdown"
  | "gatekeeper"
  | "lattice";

export interface GameDeveloperRole {
  id: GameDeveloperId;
  name: string;
  title: string;
  /** Repo paths this role may touch by default */
  paths: string[];
  reportsTo: GameDeveloperId | "iris";
  /** Finish-program slice owner (subset of roster) */
  sliceOwner?: boolean;
  /** Claude Code Game Studios upstream agent id (optional sidecar) */
  upstreamAgent?: string;
  responsibility: string;
  verify: string;
}

/** Default on_track when program is 100%; callers may override with explicit reports. */
export interface DeveloperStatusReport {
  status: ResponsibilityStatusReportStatus;
  message: string;
  writtenAt?: string;
}

export const VANTAGEGAMES_DEVELOPER_GROUP: GameDeveloperRole[] = [
  {
    id: "woodhouse",
    name: "Woodhouse",
    title: "Studio lead (delegation + dedupe)",
    paths: ["docs/", "shared/gameFinishProgram.ts", "shared/game-finish-status.json"],
    reportsTo: "iris",
    upstreamAgent: "technical-director",
    responsibility: "Prioritize slices, block duplicate Cloud agent work, relay status to Iris",
    verify: "Team → Woodhouse card; irisTeamActivity duplicate-delegate checks",
  },
  {
    id: "nightshift",
    name: "Nightshift",
    title: "Gameplay · City Nights",
    paths: ["drive-world/"],
    reportsTo: "woodhouse",
    sliceOwner: true,
    upstreamAgent: "gameplay-programmer",
    responsibility: "Driving, progression, open-world parity, Tokyo, console feel",
    verify: "npm run test:city-nights (from drive-world)",
  },
  {
    id: "skyring",
    name: "Skyring",
    title: "Gameplay · Battleworld",
    paths: ["flight-nemulator/"],
    reportsTo: "woodhouse",
    sliceOwner: true,
    upstreamAgent: "gameplay-programmer",
    responsibility: "Flight combat, arcs, chapters, open-world tier pack, lattice cloud",
    verify: "npm run test:flight-nemulator",
  },
  {
    id: "kiln",
    name: "Kiln",
    title: "Technical art",
    paths: ["gamedev-resources/", "drive-world/public/", "flight-nemulator/public/models/"],
    reportsTo: "woodhouse",
    upstreamAgent: "technical-artist",
    responsibility: "Visual tiers, CC0 packs, hero GLBs, World Gacha workflow",
    verify: "npm run test:gamedev-resources; docs/VISUAL_UPGRADE_TIERS.md",
  },
  {
    id: "mixdown",
    name: "Mixdown",
    title: "Audio",
    paths: ["drive-world/src/audio/", "drive-world/public/audio/"],
    reportsTo: "woodhouse",
    upstreamAgent: "audio-director",
    responsibility: "Playlist beds, ACE step, HUD music settings",
    verify: "cn-d09 checks in test:game-finish",
  },
  {
    id: "gatekeeper",
    name: "Gatekeeper",
    title: "QA / playtest",
    paths: ["scripts/playtest-*.mjs", "scripts/check-*.mts"],
    reportsTo: "woodhouse",
    upstreamAgent: "qa-lead",
    responsibility: "Couch pass, CI gates, release finish gate",
    verify: "VANTAGEGAME_FINISH_GATE=1 npm run test:game-finish; npm run test:os",
  },
  {
    id: "lattice",
    name: "Lattice",
    title: "Tools & deploy",
    paths: ["netlify/", "games-hub/", "tools/gamedev-resources/"],
    reportsTo: "woodhouse",
    upstreamAgent: "devops-engineer",
    responsibility: "Netlify functions, Vantage deploy, production wiring audit",
    verify: "npm run test:vantage-production",
  },
];

const BY_ID = new Map(VANTAGEGAMES_DEVELOPER_GROUP.map((d) => [d.id, d]));

export function gameDeveloperById(id: string): GameDeveloperRole | undefined {
  return BY_ID.get(id as GameDeveloperId);
}

export function sliceOwnerDevelopers(): GameDeveloperRole[] {
  return VANTAGEGAMES_DEVELOPER_GROUP.filter((d) => d.sliceOwner);
}

/** Walk `reportsTo` toward iris; returns role ids in order (leaf → … → woodhouse). */
export function reportingChain(leafId: GameDeveloperId): GameDeveloperRole[] {
  const chain: GameDeveloperRole[] = [];
  let cur: GameDeveloperRole | undefined = gameDeveloperById(leafId);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.push(cur);
    if (cur.reportsTo === "iris") break;
    cur = gameDeveloperById(cur.reportsTo);
  }
  return chain;
}

/** Paperclip-shaped default report from finish-program percent for slice owners. */
export function defaultDeveloperReport(
  dev: GameDeveloperRole,
  percent: number
): DeveloperStatusReport {
  if (percent >= 100) {
    return { status: "on_track", message: `${dev.name} finished all assigned program slices; season backlog is optional.` };
  }
  if (percent >= 80) {
    return { status: "on_track", message: `Program at ${percent}% with clear verify hooks for ${dev.paths[0] ?? "studio"}.` };
  }
  if (percent >= 50) {
    return { status: "at_risk", message: `Program at ${percent}% — next slice should stay day-sized to avoid drift.` };
  }
  return { status: "behind", message: `Program at ${percent}% — needs an active slice and game-finish:report.` };
}