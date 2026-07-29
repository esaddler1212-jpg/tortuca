import type { WoodhouseSnapshotV2 } from "../types/woodhouse";
import {
  isWoodhouseSnapshot,
  upgradeWoodhouseSnapshot,
  WOODHOUSE_V2,
} from "../types/woodhouse";
import { loadSettings } from "./storage";

function apiBase(): string {
  return "/api";
}

export function demoWoodhouseSnapshot(): WoodhouseSnapshotV2 {
  const generatedAt = new Date().toISOString();
  return {
    protocol: WOODHOUSE_V2,
    generatedAt,
    store: {
      storeId: "easy-supply-co-demo",
      storeName: "Easy Supply Co. (demo)",
      metrics: {
        monthToDateRevenue: 2840,
        monthToDateOrders: 18,
        goalProgressPercent: 57,
        pendingApprovals: 2,
      },
      pendingOrderIds: ["demo-1001", "demo-1002"],
      priorityActions: [
        "Approve 2 pending Shopify orders",
        "Close $2160 gap to $5000/mo goal",
      ],
    },
    familyPurpose: {
      nodeId: "family-purpose-demo",
      appName: "Family Purpose",
      schoolName: "Oak Grove Middle School",
      groupName: "BOYS Group",
      day: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(
        new Date(),
      ),
      schoolDay: { isSchoolDay: true, label: "School day" },
      stats: {
        checkInsToday: 3,
        followUpsDueToday: 1,
        followUpsOverdue: 0,
        groupMeetingsToday: 1,
      },
      calendar: [
        {
          id: "group-demo",
          kind: "group_meeting",
          title: "BOYS Group meeting",
          start: generatedAt,
          detail: "Weekly mentoring sign-in",
        },
        {
          id: "follow-demo",
          kind: "follow_up_due",
          title: "Follow up: Andre Bell",
          start: generatedAt,
          detail: "Attendance / tardiness",
        },
      ],
      priorityActions: ["1 follow-up due today"],
    },
    priorityActions: [
      "Approve 2 pending Shopify orders",
      "1 follow-up due today",
    ],
  };
}

export async function fetchWoodhouseSnapshot(): Promise<{
  snapshot: WoodhouseSnapshotV2;
  source: "live" | "demo" | "proxy" | "backup";
}> {
  const settings = loadSettings();
  const headers: HeadersInit = {};
  if (settings.woodhouseNodeUrl.trim()) {
    headers["X-Woodhouse-Node-Url"] = settings.woodhouseNodeUrl.trim().replace(/\/$/, "");
  }
  if (settings.familyPurposeNodeUrl.trim()) {
    headers["X-Woodhouse-Family-Url"] = settings.familyPurposeNodeUrl.trim().replace(/\/$/, "");
  }

  try {
    const res = await fetch(`${apiBase()}/woodhouse`, { headers });
    if (res.ok) {
      const body: unknown = await res.json();
      if (isWoodhouseSnapshot(body)) {
        const snapshot = upgradeWoodhouseSnapshot(body);
        const headerSource = res.headers.get("X-Woodhouse-Source");
        const source =
          headerSource === "demo"
            ? "demo"
            : headerSource === "backup"
              ? "backup"
              : "proxy";
        return { snapshot, source };
      }
    }
  } catch {
    /* Netlify Functions unavailable in plain Vite dev */
  }

  return { snapshot: demoWoodhouseSnapshot(), source: "demo" };
}

export { WOODHOUSE_V2 };
