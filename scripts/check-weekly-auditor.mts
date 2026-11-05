/** Weekly auditor unit checks — run via npm run test:weekly */
import { buildWeeklyAuditReport, WEEKLY_AUDIT_CRON } from "../shared/weeklyAuditor.ts";

let n = 0;
const ok = (name: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

const base = {
  at: new Date().toISOString(),
  timeZone: "America/Los_Angeles",
  env: { anthropic: true, google: true, finnhub: false, shopifyConfigured: false },
  blobsOk: true,
  users: {
    accounts: 1,
    pushEnabled: 1,
    morningDigestEnabled: 0,
    googleConnectedSessions: 1,
    staleLiveCommute: 0,
  },
};

const happy = buildWeeklyAuditReport(base);
ok("happy path status ok", happy.status === "ok");
ok("suggests finnhub when missing", happy.suggestions.some((s) => s.title.includes("demo")));

const broken = buildWeeklyAuditReport({
  ...base,
  env: { ...base.env, anthropic: false },
  blobsOk: false,
});
ok("missing anthropic → failed", broken.status === "failed");

ok("cron is Monday 08:00 UTC (midnight Pacific PST)", WEEKLY_AUDIT_CRON === "0 8 * * 1");

console.log(process.exitCode ? `\nWeekly auditor tests failed (${n}).` : `\nWeekly auditor tests passed (${n}).`);
