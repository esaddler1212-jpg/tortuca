/**
 * MAYA Sentinel — local ZIP static review before installing cherry-picked OSS.
 * Not wired to Netlify; Iris context only (see docs/DEEP_DIVE_MAYA_SENTINEL.md).
 */
export const MAYA_SENTINEL_MODES = [
  "safety",
  "supply-chain",
  "ai-surface",
  "phishing",
  "exfil",
  "archive",
] as const;

export type MayaSentinelMode = (typeof MAYA_SENTINEL_MODES)[number];

export function mayaSentinelModeForRepo(kind: "commerce" | "finance" | "design-system" | "agent-mcp" | "unknown"): MayaSentinelMode {
  switch (kind) {
    case "agent-mcp":
      return "ai-surface";
    case "commerce":
    case "finance":
      return "supply-chain";
    default:
      return "safety";
  }
}

/** Iris: gate reckless install advice when user asks to clone/run external repos. */
export function mayaCherryPickGuardForIris(): string {
  return [
    "Cherry-pick hygiene (MAYA Sentinel): before npm install, docker compose, or MCP enable on an unfamiliar GitHub repo,",
    "zip the clone locally (tools/maya-sentinel/zip-repo-for-scan.sh) and run MAYA Sentinel loopback — modes ai-surface for agents/MCP, supply-chain for Node/Rails apps.",
    "Sentinel cannot prove safety; Blocked/Risk means do not wire into Tortuca or Netlify env. Tortuca release still requires npm run scan:secrets and test:os on our tree.",
    "Hub Watch tab is for your live URLs, not substitute for Sentinel on third-party zips.",
  ].join(" ");
}