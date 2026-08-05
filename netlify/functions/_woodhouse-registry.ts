/**
 * Server-side Woodhouse registry and snapshot normalization.
 */

export interface RegistryEntry {
  id: string;
  displayName: string;
  nodeType: string;
  baseUrl: string;
  provider?: "family-purpose-backup";
}

export interface NodeSnapshot {
  protocol: "woodhouse/node/v1";
  nodeId: string;
  nodeType: string;
  displayName: string;
  generatedAt: string;
  status: "ok" | "degraded" | "error" | "offline";
  summary: string;
  metrics: Array<{ key: string; label: string; value: string | number; alert?: boolean }>;
  calendar?: Array<{
    id: string;
    kind: string;
    title: string;
    start: string;
    end?: string;
    detail?: string;
  }>;
  priorityActions: string[];
  links?: { label: string; url: string }[];
}

export function parseRegistryFromEnv(): RegistryEntry[] {
  const raw = process.env.WOODHOUSE_NODES?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RegistryEntry[];
      if (Array.isArray(parsed)) return parsed.filter((e) => e.id && e.displayName);
    } catch {
      /* ignore */
    }
  }

  const entries: RegistryEntry[] = [];
  const easy = process.env.WOODHOUSE_EASY_SUPPLY_URL?.trim();
  if (easy) {
    entries.push({
      id: "easy-supply-co",
      displayName: "Easy Supply Co.",
      nodeType: "commerce",
      baseUrl: easy.replace(/\/$/, ""),
    });
  }
  const fp = process.env.WOODHOUSE_FAMILY_PURPOSE_URL?.trim();
  if (fp) {
    entries.push({
      id: "family-purpose",
      displayName: "Family Purpose",
      nodeType: "education",
      baseUrl: fp.replace(/\/$/, ""),
    });
  } else if (process.env.FAMILY_PURPOSE_BACKUP_KEY) {
    entries.push({
      id: "family-purpose",
      displayName: "Family Purpose",
      nodeType: "education",
      baseUrl: "",
      provider: "family-purpose-backup",
    });
  }
  return entries;
}

export function parseRegistryHeader(header: string | undefined): RegistryEntry[] {
  if (!header?.trim()) return [];
  try {
    const parsed = JSON.parse(header) as RegistryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Normalize legacy Easy Supply v1 body or a proper node snapshot. */
export function normalizeRemoteSnapshot(
  registry: RegistryEntry,
  body: unknown,
): NodeSnapshot | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (o.protocol === "woodhouse/node/v1") {
    return body as NodeSnapshot;
  }

  if (registry.nodeType === "commerce" && o.storeName && o.metrics) {
    const m = o.metrics as Record<string, number>;
    const pending = m.pendingApprovals ?? 0;
    return {
      protocol: "woodhouse/node/v1",
      nodeId: registry.id,
      nodeType: "commerce",
      displayName: String(o.storeName),
      generatedAt: String(o.generatedAt ?? new Date().toISOString()),
      status: "ok",
      summary:
        pending > 0
          ? `${pending} order${pending === 1 ? "" : "s"} need approval`
          : `${Math.round(m.goalProgressPercent ?? 0)}% of monthly revenue goal`,
      metrics: [
        { key: "revenue", label: "MTD revenue", value: m.monthToDateRevenue ?? 0 },
        { key: "orders", label: "Orders", value: m.monthToDateOrders ?? 0 },
        {
          key: "goal",
          label: "Goal",
          value: `${Math.round(m.goalProgressPercent ?? 0)}%`,
        },
        {
          key: "pending",
          label: "Pending approvals",
          value: pending,
          alert: pending > 0,
        },
      ],
      priorityActions: Array.isArray(o.priorityActions) ? (o.priorityActions as string[]) : [],
    };
  }

  if (registry.nodeType === "education" && o.appName) {
    const stats = (o.stats ?? {}) as Record<string, number>;
    const overdue = stats.followUpsOverdue ?? 0;
    const dueToday = stats.followUpsDueToday ?? 0;
    return {
      protocol: "woodhouse/node/v1",
      nodeId: registry.id,
      nodeType: "education",
      displayName: String(o.appName),
      generatedAt: new Date().toISOString(),
      status: overdue > 0 ? "degraded" : "ok",
      summary:
        overdue > 0
          ? `${overdue} overdue follow-up${overdue === 1 ? "" : "s"}`
          : dueToday > 0
            ? `${dueToday} follow-up${dueToday === 1 ? "" : "s"} due today`
            : String((o.schoolDay as { label?: string })?.label ?? "School day"),
      metrics: [
        { key: "checkins", label: "Check-ins today", value: stats.checkInsToday ?? 0 },
        {
          key: "due",
          label: "Follow-ups due",
          value: dueToday,
          alert: dueToday > 0,
        },
        {
          key: "overdue",
          label: "Overdue",
          value: overdue,
          alert: overdue > 0,
        },
        { key: "meetings", label: "Group meetings", value: stats.groupMeetingsToday ?? 0 },
      ],
      calendar: Array.isArray(o.calendar) ? (o.calendar as NodeSnapshot["calendar"]) : [],
      priorityActions: Array.isArray(o.priorityActions) ? (o.priorityActions as string[]) : [],
    };
  }

  if (typeof o.displayName === "string" && typeof o.summary === "string") {
    return {
      protocol: "woodhouse/node/v1",
      nodeId: registry.id,
      nodeType: registry.nodeType,
      displayName: o.displayName,
      generatedAt: String(o.generatedAt ?? new Date().toISOString()),
      status: (o.status as NodeSnapshot["status"]) ?? "ok",
      summary: o.summary,
      metrics: Array.isArray(o.metrics) ? (o.metrics as NodeSnapshot["metrics"]) : [],
      calendar: Array.isArray(o.calendar) ? (o.calendar as NodeSnapshot["calendar"]) : [],
      priorityActions: Array.isArray(o.priorityActions) ? (o.priorityActions as string[]) : [],
    };
  }

  return null;
}

export function demoRegistry(): RegistryEntry[] {
  return [
    {
      id: "easy-supply-co",
      displayName: "Easy Supply Co.",
      nodeType: "commerce",
      baseUrl: "",
    },
    {
      id: "family-purpose",
      displayName: "Family Purpose",
      nodeType: "education",
      baseUrl: "",
    },
  ];
}
