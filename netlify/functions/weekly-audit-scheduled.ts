import type { Config, Handler } from "@netlify/functions";
import { WEEKLY_AUDIT_CRON } from "../../shared/weeklyAuditor";
import { runWeeklyAuditJob } from "./_weeklyAuditorRun";

/** Monday midnight Pacific (08:00 UTC) — production smoke + suggestions (full test:os runs in GitHub weekly-audit workflow). */
export const config: Config = {
  schedule: WEEKLY_AUDIT_CRON,
};

export const handler: Handler = async (event) => {
  try {
    const { report, emailed } = await runWeeklyAuditJob(event);
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: report.status !== "failed",
        status: report.status,
        at: report.at,
        suggestions: report.suggestions.length,
        emailed,
      }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "weekly audit failed";
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
};
