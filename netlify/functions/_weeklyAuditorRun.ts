import { getStore } from "@netlify/blobs";
import { googleConfigured, initBlobs, listConnectedSessions, sendGmail } from "./_shared";
import { listAllUserData, pushTargets } from "./_userData";
import {
  buildWeeklyAuditReport,
  formatWeeklyAuditMarkdown,
  type WeeklyAuditReport,
  type WeeklyAuditUserStats,
} from "../../shared/weeklyAuditor";

const STORE = "alfred-weekly-audit";
const LATEST_KEY = "latest";

export async function loadLatestWeeklyAudit(): Promise<WeeklyAuditReport | null> {
  const store = getStore({ name: STORE });
  const raw = (await store.get(LATEST_KEY, { type: "json" }).catch(() => null)) as WeeklyAuditReport | null;
  return raw?.at ? raw : null;
}

export async function saveWeeklyAudit(report: WeeklyAuditReport): Promise<void> {
  const store = getStore({ name: STORE });
  await store.setJSON(LATEST_KEY, report);
  const weekKey = report.at.slice(0, 10);
  await store.setJSON(`history/${weekKey}`, report);
}

async function blobsSelfTest(): Promise<boolean> {
  try {
    const store = getStore({ name: STORE });
    const probe = `probe-${Date.now()}`;
    await store.set(probe, "1");
    const v = await store.get(probe);
    await store.delete(probe);
    return v === "1";
  } catch {
    return false;
  }
}

function collectUserStats(
  users: Awaited<ReturnType<typeof listAllUserData>>,
  connectedCount: number,
): WeeklyAuditUserStats {
  let pushEnabled = 0;
  let morningDigestEnabled = 0;
  let staleLiveCommute = 0;
  const now = Date.now();
  for (const { data } of users) {
    if (data.settings?.pushNotificationsEnabled && pushTargets(data).length) pushEnabled++;
    if (data.settings?.morningDigestEnabled) morningDigestEnabled++;
    const updated = data.liveCommute?.fetchedAt ? Date.parse(data.liveCommute.fetchedAt) : 0;
    if (data.liveCommute && updated && now - updated > 36 * 60 * 60_000) staleLiveCommute++;
  }
  return {
    accounts: users.length,
    pushEnabled,
    morningDigestEnabled,
    googleConnectedSessions: connectedCount,
    staleLiveCommute,
  };
}

export async function runWeeklyProductionAudit(timeZone = "America/Los_Angeles"): Promise<WeeklyAuditReport> {
  const at = new Date().toISOString();
  const users = await listAllUserData();
  const sessions = await listConnectedSessions();
  const existing = await loadLatestWeeklyAudit();

  const report = buildWeeklyAuditReport({
    at,
    timeZone,
    env: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      google: googleConfigured(),
      finnhub: Boolean(process.env.FINNHUB_API_KEY?.trim()),
      shopifyConfigured: Boolean(
        process.env.SHOPIFY_STORE_DOMAIN?.trim() && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim(),
      ),
    },
    blobsOk: await blobsSelfTest(),
    users: collectUserStats(users, sessions.length),
    ci: existing?.ci?.at && existing.ci.at > new Date(Date.now() - 8 * 24 * 60 * 60_000).toISOString() ? existing.ci : undefined,
  });

  await saveWeeklyAudit(report);
  return report;
}

export async function mergeWeeklyCiResult(passed: boolean, note?: string): Promise<WeeklyAuditReport> {
  const at = new Date().toISOString();
  const existing = (await loadLatestWeeklyAudit()) ?? (await runWeeklyProductionAudit());
  const merged = buildWeeklyAuditReport({
    at: existing.at,
    timeZone: existing.timeZone,
    env: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      google: googleConfigured(),
      finnhub: Boolean(process.env.FINNHUB_API_KEY?.trim()),
      shopifyConfigured: Boolean(
        process.env.SHOPIFY_STORE_DOMAIN?.trim() && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim(),
      ),
    },
    blobsOk: existing.checks.find((c) => c.id === "blobs")?.ok ?? true,
    users: {
      accounts: existing.stats?.accounts ?? 0,
      pushEnabled: existing.stats?.pushEnabled ?? 0,
      morningDigestEnabled: existing.stats?.morningDigestEnabled ?? 0,
      googleConnectedSessions: existing.stats?.googleConnectedSessions ?? 0,
      staleLiveCommute: 0,
    },
    ci: { passed, at, note: note?.slice(0, 2000) },
  });
  merged.at = at;
  await saveWeeklyAudit(merged);
  return merged;
}

export async function emailWeeklyAuditIfConfigured(report: WeeklyAuditReport): Promise<boolean> {
  const to = process.env.WEEKLY_AUDIT_EMAIL?.trim();
  if (!to) return false;
  const sessions = await listConnectedSessions();
  const sender = sessions.find((s) => s.session.email?.toLowerCase() === to.toLowerCase()) ?? sessions[0];
  if (!sender?.session.email) return false;

  const text = formatWeeklyAuditMarkdown(report);
  const html = text
    .replace(/^# (.+)$/m, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- /gm, "<li>")
    .replace(/\n/g, "<br/>");
  return sendGmail(sender.session, to, `[IRIS] Weekly auditor — ${report.status}`, `<div>${html}</div>`, text);
}

export async function runWeeklyAuditJob(event: Parameters<typeof initBlobs>[0]): Promise<{ report: WeeklyAuditReport; emailed: boolean }> {
  initBlobs(event);
  const report = await runWeeklyProductionAudit();
  const emailed = await emailWeeklyAuditIfConfigured(report);
  return { report, emailed };
}
