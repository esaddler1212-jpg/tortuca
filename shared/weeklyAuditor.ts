/**
 * Weekly auditor — production smoke + efficiency suggestions.
 * Scheduled Sunday→Monday overnight (see weekly-audit-scheduled.ts).
 * Full repo checks run in GitHub Actions (test:os); results can be merged via ingest.
 */

export type WeeklyAuditCheck = {
  id: string;
  ok: boolean;
  detail: string;
};

export type WeeklyAuditSuggestion = {
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
};

export type WeeklyAuditReport = {
  at: string;
  timeZone: string;
  status: "ok" | "degraded" | "failed";
  summary: string;
  checks: WeeklyAuditCheck[];
  suggestions: WeeklyAuditSuggestion[];
  /** GitHub test:os result when ingested from CI */
  ci?: { passed: boolean; at: string; note?: string };
  stats?: {
    accounts: number;
    pushEnabled: number;
    morningDigestEnabled: number;
    googleConnectedSessions: number;
  };
};

export type WeeklyAuditEnvFlags = {
  anthropic: boolean;
  google: boolean;
  finnhub: boolean;
  shopifyConfigured: boolean;
};

export type WeeklyAuditUserStats = {
  accounts: number;
  pushEnabled: number;
  morningDigestEnabled: number;
  googleConnectedSessions: number;
  staleLiveCommute: number;
};

/** Netlify cron: Monday 08:00 UTC = midnight US Pacific (PST, UTC−8). */
export const WEEKLY_AUDIT_CRON = "0 8 * * 1";

export function buildWeeklyAuditReport(input: {
  at: string;
  timeZone: string;
  env: WeeklyAuditEnvFlags;
  blobsOk: boolean;
  users: WeeklyAuditUserStats;
  ci?: WeeklyAuditReport["ci"];
}): WeeklyAuditReport {
  const checks: WeeklyAuditCheck[] = [
    {
      id: "env-anthropic",
      ok: input.env.anthropic,
      detail: input.env.anthropic ? "Iris API key present" : "ANTHROPIC_API_KEY missing — voice brain offline",
    },
    {
      id: "env-google",
      ok: input.env.google,
      detail: input.env.google ? "Google OAuth configured" : "Google OAuth incomplete — Gmail/calendar sync blocked",
    },
    {
      id: "blobs",
      ok: input.blobsOk,
      detail: input.blobsOk ? "Netlify Blobs read/write OK" : "Blob store check failed",
    },
    {
      id: "accounts",
      ok: input.users.accounts >= 0,
      detail: `${input.users.accounts} account data blob(s) on file`,
    },
  ];

  if (input.ci) {
    checks.push({
      id: "ci-test-os",
      ok: input.ci.passed,
      detail: input.ci.passed ? "GitHub weekly test:os passed" : "GitHub weekly test:os failed — see CI logs",
    });
  }

  const suggestions: WeeklyAuditSuggestion[] = [];

  if (!input.env.anthropic) {
    suggestions.push({
      priority: "high",
      title: "Restore Iris",
      body: "Add ANTHROPIC_API_KEY in Netlify environment variables and redeploy so /api/ask works.",
    });
  }
  if (!input.env.google) {
    suggestions.push({
      priority: "high",
      title: "Finish Google OAuth",
      body: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET; confirm the auth callback URL in Google Cloud matches Netlify.",
    });
  }
  if (!input.env.finnhub) {
    suggestions.push({
      priority: "low",
      title: "Markets in demo mode",
      body: "Add FINNHUB_API_KEY for live Hub/Today market quotes; demo data works without it.",
    });
  }
  if (!input.env.shopifyConfigured) {
    suggestions.push({
      priority: "medium",
      title: "Easy Supply read layer",
      body: "Configure Shopify env vars on Netlify so Wire/Apps can show store snapshot without manual checks.",
    });
  }
  if (input.users.accounts > 0 && input.users.pushEnabled === 0) {
    suggestions.push({
      priority: "medium",
      title: "Enable push reminders",
      body: "No accounts have push enabled — turn on push in Settings for leave-by and wind-down nudges.",
    });
  }
  if (input.users.staleLiveCommute > 0) {
    suggestions.push({
      priority: "medium",
      title: "Refresh live commute",
      body: `${input.users.staleLiveCommute} account(s) have stale commute data — open Vitals/Today on a school morning or check commute-scheduled.`,
    });
  }
  if (input.users.googleConnectedSessions === 0 && input.users.accounts > 0) {
    suggestions.push({
      priority: "medium",
      title: "Reconnect Google",
      body: "User data exists but no active Google sessions — sign in again on a device to restore Gmail and sync.",
    });
  }
  suggestions.push({
    priority: "low",
    title: "Keep CI green",
    body: "Before big releases, run npm run test:os locally — same gate as the weekly GitHub auditor.",
  });
  if (input.ci && !input.ci.passed) {
    suggestions.push({
      priority: "high",
      title: "Fix failing weekly CI",
      body: input.ci.note ?? "Review the latest weekly-audit GitHub Actions run and fix regressions before Monday use.",
    });
  }

  const failed = checks.filter((c) => !c.ok);
  const status: WeeklyAuditReport["status"] =
    failed.some((c) => c.id === "env-anthropic" || c.id === "blobs" || (c.id === "ci-test-os" && !c.ok))
      ? "failed"
      : failed.length
        ? "degraded"
        : "ok";

  const summary =
    status === "ok"
      ? "Weekly auditor: all core checks passed."
      : status === "degraded"
        ? `Weekly auditor: ${failed.length} check(s) need attention.`
        : "Weekly auditor: critical issues — Iris or storage may be impaired.";

  return {
    at: input.at,
    timeZone: input.timeZone,
    status,
    summary,
    checks,
    suggestions: suggestions.slice(0, 8),
    ci: input.ci,
    stats: {
      accounts: input.users.accounts,
      pushEnabled: input.users.pushEnabled,
      morningDigestEnabled: input.users.morningDigestEnabled,
      googleConnectedSessions: input.users.googleConnectedSessions,
    },
  };
}

export function formatWeeklyAuditMarkdown(r: WeeklyAuditReport): string {
  const lines = [
    `# IRIS weekly auditor`,
    ``,
    `**When:** ${r.at} (${r.timeZone})`,
    `**Status:** ${r.status.toUpperCase()} — ${r.summary}`,
    ``,
    `## Checks`,
    ...r.checks.map((c) => `- ${c.ok ? "✓" : "✗"} **${c.id}** — ${c.detail}`),
    ``,
    `## Suggestions`,
    ...r.suggestions.map((s) => `- **${s.priority}** — ${s.title}: ${s.body}`),
  ];
  if (r.stats) {
    lines.push("", "## Stats", `- Accounts: ${r.stats.accounts}`, `- Push enabled: ${r.stats.pushEnabled}`);
  }
  return lines.join("\n");
}
