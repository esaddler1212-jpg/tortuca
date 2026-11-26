/**
 * Daily checklist Nov 26 2026 → Jan 1 2027 activation (Revenue OS).
 * Times are suggestions for ~11–15 hrs/week (~1.5–2.5 hrs on most weekdays).
 */

export const REVENUE_ACTIVATION_START = "2026-11-26";
export const REVENUE_ACTIVATION_GO_LIVE = "2027-01-01";

export interface ActivationTask {
  id: string;
  label: string;
  /** Rough minutes */
  minutes?: number;
}

export interface ActivationDayPlan {
  date: string;
  theme: string;
  tasks: ActivationTask[];
  /** Thanksgiving / winter recess — shorter list */
  light?: boolean;
}

/** Inclusive prep days through Dec 31; Jan 1 is go-live (separate). */
export const REVENUE_ACTIVATION_PREP: ActivationDayPlan[] = [
  {
    date: "2026-11-26",
    theme: "Kickoff",
    tasks: [
      { id: "read-os", label: "Skim docs/REVENUE_OS.md — confirm $2k, 60/40, bootstrap rules", minutes: 20 },
      { id: "pkg", label: "Hub → Revenue OS: lock Standard $125 thumbnail package", minutes: 5 },
      { id: "niches", label: "Write 3 thumbnail niches to pursue (film · gaming · Bay creators)", minutes: 15 },
    ],
  },
  {
    date: "2026-11-27",
    theme: "Portfolio",
    tasks: [
      { id: "samples", label: "Make 3 sample thumbnails (real or spec redesigns)", minutes: 90 },
      { id: "memo", label: "Save portfolio notes + links in Hub memo", minutes: 15 },
    ],
  },
  {
    date: "2026-11-28",
    theme: "Offer sheet",
    tasks: [
      { id: "one-pager", label: "One-pager: packages, turnaround 48–72h, 1 revision, how to pay", minutes: 45 },
      { id: "scout", label: "Run Scout preset Thumbnail pricing → read memo", minutes: 25 },
    ],
  },
  {
    date: "2026-11-29",
    theme: "List the gig",
    tasks: [
      { id: "listing", label: "Draft Fiverr/IG/Link-in-bio listing using Standard $125 (publish optional)", minutes: 60 },
      { id: "assets", label: "Upload 3 portfolio samples to the listing or Drive folder", minutes: 30 },
    ],
  },
  {
    date: "2026-11-30",
    theme: "Outreach list",
    tasks: [
      { id: "targets", label: "List 10 creators or small brands to pitch (name + channel)", minutes: 30 },
      { id: "script", label: "Short outreach script (3 sentences + link)", minutes: 20 },
    ],
    light: true,
  },
  {
    date: "2026-12-01",
    theme: "First pitches",
    tasks: [
      { id: "send3", label: "Send 3 outreach messages (DM or email)", minutes: 30 },
      { id: "log", label: "Hub Money or memo: log any reply or booking", minutes: 5 },
    ],
  },
  {
    date: "2026-12-02",
    theme: "Shopify recon",
    tasks: [
      { id: "readiness", label: "Apps → Easy Supply: note Shopify readiness gaps", minutes: 15 },
      { id: "comps", label: "Scout Merch DTC comps preset — pricing notes for sweats", minutes: 25 },
      { id: "check-photos", label: "Revenue OS: tick photos if you have any product shots", minutes: 10 },
    ],
  },
  {
    date: "2026-12-03",
    theme: "Deliver or practice",
    tasks: [
      { id: "deliver", label: "If booked: deliver thumbnails OR do 1 practice set for portfolio", minutes: 120 },
      { id: "income", label: "Log Thumbnails income in Hub if paid", minutes: 5 },
    ],
  },
  {
    date: "2026-12-04",
    theme: "More outreach",
    tasks: [
      { id: "send3", label: "Send 3 more pitches from your list", minutes: 30 },
      { id: "followup", label: "Follow up one warm lead", minutes: 15 },
    ],
  },
  {
    date: "2026-12-05",
    theme: "SKU decision",
    tasks: [
      { id: "sku", label: "Pick 1–2 hero SKUs + sizes/colors for Easy Supply", minutes: 45 },
      { id: "hero_sku", label: "Revenue OS checklist: hero_sku planning done → tick when live in Shopify", minutes: 10 },
    ],
  },
  {
    date: "2026-12-06",
    theme: "Weekend shop",
    tasks: [
      { id: "photos", label: "Shoot or gather hero product photos", minutes: 90 },
      { id: "photos-tick", label: "Tick photos on launch checklist when usable", minutes: 5 },
    ],
    light: true,
  },
  {
    date: "2026-12-07",
    theme: "Week review",
    tasks: [
      { id: "review", label: "Check MTD on Revenue OS — gap to $800 service slice", minutes: 10 },
      { id: "plan", label: "Pick next week's 3 priority tasks", minutes: 15 },
    ],
  },
  {
    date: "2026-12-08",
    theme: "Shopify listing draft",
    tasks: [
      { id: "draft", label: "Draft product copy + price in Shopify Admin (draft OK)", minutes: 60 },
      { id: "inventory", label: "Confirm supplier/qty — tick inventory when verified", minutes: 20 },
    ],
  },
  {
    date: "2026-12-09",
    theme: "Thumbnail batch",
    tasks: [
      { id: "work", label: "Client work or 2 portfolio pieces", minutes: 90 },
      { id: "templates", label: "Save reusable PSD/template names in Hub memo", minutes: 20 },
    ],
  },
  {
    date: "2026-12-10",
    theme: "Shipping & policies",
    tasks: [
      { id: "ship", label: "Shopify shipping zones + return policy draft", minutes: 45 },
      { id: "shipping-tick", label: "Tick shipping when published", minutes: 5 },
    ],
  },
  {
    date: "2026-12-11",
    theme: "Outreach push",
    tasks: [
      { id: "send5", label: "Send 5 thumbnail pitches", minutes: 40 },
    ],
  },
  {
    date: "2026-12-12",
    theme: "API wiring",
    tasks: [
      { id: "netlify", label: "Confirm Shopify env vars on Netlify + refresh store panel", minutes: 30 },
      { id: "api-tick", label: "Tick shopify_api when read works in app", minutes: 5 },
    ],
  },
  {
    date: "2026-12-13",
    theme: "Weekend",
    tasks: [
      { id: "rest", label: "Light: deliver any due thumbnails only", minutes: 60 },
    ],
    light: true,
  },
  {
    date: "2026-12-14",
    theme: "Payout ready",
    tasks: [
      { id: "payout", label: "Shopify payout/bank connection verified", minutes: 20 },
      { id: "payout-tick", label: "Tick payout on launch checklist", minutes: 5 },
    ],
  },
  {
    date: "2026-12-15",
    theme: "Publish or hold",
    tasks: [
      { id: "active", label: "Set product Active in Shopify OR document go-live date Jan 1", minutes: 30 },
      { id: "price", label: "Double-check price matches merch comp notes", minutes: 15 },
    ],
  },
  {
    date: "2026-12-16",
    theme: "Service income",
    tasks: [
      { id: "invoice", label: "Close any open thumbnail jobs; log Thumbnails income", minutes: 30 },
      { id: "testimonial", label: "Ask 1 happy client for a one-line testimonial", minutes: 10 },
    ],
  },
  {
    date: "2026-12-17",
    theme: "Soft launch draft",
    tasks: [
      { id: "post", label: "Write organic soft-launch post (IG/story) — schedule for Jan 1", minutes: 45 },
    ],
  },
  {
    date: "2026-12-18",
    theme: "Buffer day",
    tasks: [
      { id: "catchup", label: "Catch up any unchecked launch checklist items", minutes: 60 },
    ],
  },
  {
    date: "2026-12-19",
    theme: "Outreach",
    tasks: [
      { id: "send3", label: "3 thumbnail pitches before the holiday slow-down", minutes: 30 },
    ],
  },
  {
    date: "2026-12-20",
    theme: "Weekend",
    tasks: [
      { id: "photo", label: "One extra product photo if shop still needs polish", minutes: 45 },
    ],
    light: true,
  },
  {
    date: "2026-12-21",
    theme: "Freedom math",
    tasks: [
      { id: "math", label: "Update Hub revenueGoal ($2k) and review MTD split", minutes: 15 },
      { id: "kill", label: "Archive any side idea with no signal in 14 days", minutes: 10 },
    ],
  },
  {
    date: "2026-12-22",
    theme: "Pre-holiday",
    tasks: [
      { id: "inbox", label: "Clear thumbnail client messages; set auto-reply if away", minutes: 30 },
    ],
  },
  {
    date: "2026-12-23",
    theme: "Winter recess",
    tasks: [{ id: "maintain", label: "15 min only: check Revenue OS + one checklist item", minutes: 15 }],
    light: true,
  },
  {
    date: "2026-12-24",
    theme: "Winter recess",
    tasks: [{ id: "off", label: "Off or family day — optional Hub check", minutes: 0 }],
    light: true,
  },
  {
    date: "2026-12-25",
    theme: "Winter recess",
    tasks: [{ id: "off", label: "Off — rest", minutes: 0 }],
    light: true,
  },
  {
    date: "2026-12-26",
    theme: "Winter recess",
    tasks: [{ id: "memo", label: "Hub memo: Jan 1 launch final gaps (bullet list)", minutes: 20 }],
    light: true,
  },
  {
    date: "2026-12-27",
    theme: "Return ramp",
    tasks: [
      { id: "list", label: "List Jan 1–7 actions (shop post + 3 pitches)", minutes: 20 },
      { id: "deliver", label: "Finish any owed thumbnails", minutes: 90 },
    ],
  },
  {
    date: "2026-12-28",
    theme: "Launch QA",
    tasks: [
      { id: "test", label: "Test checkout on storefront (test mode or real)", minutes: 30 },
      { id: "refresh", label: "Refresh Shopify panel in IRIS", minutes: 5 },
    ],
  },
  {
    date: "2026-12-29",
    theme: "Thumbnail push",
    tasks: [
      { id: "send5", label: "5 pitches — goal 2 bookings for January", minutes: 40 },
    ],
  },
  {
    date: "2026-12-30",
    theme: "Eve prep",
    tasks: [
      { id: "checklist", label: "All 7 Shopify launch boxes ticked or documented blockers", minutes: 20 },
      { id: "post", label: "Queue Jan 1 soft_launch post", minutes: 15 },
    ],
  },
  {
    date: "2026-12-31",
    theme: "New Year's Eve",
    tasks: [
      { id: "brief", label: "Tell Iris: Brief me — note revenue gap line", minutes: 5 },
      { id: "ready", label: "Pack listing links + payment method for tomorrow", minutes: 15 },
    ],
    light: true,
  },
];

export const REVENUE_ACTIVATION_GO_LIVE_PLAN: ActivationDayPlan = {
  date: REVENUE_ACTIVATION_GO_LIVE,
  theme: "ACTIVATE Revenue OS",
  tasks: [
    { id: "live", label: "Publish soft_launch post + confirm store Active", minutes: 30 },
    { id: "soft-tick", label: "Tick soft_launch on Revenue OS checklist", minutes: 5 },
    { id: "goal", label: "Hub Money: revenue goal $2,000 — log Jan income as it arrives", minutes: 10 },
    { id: "iris", label: "Voice: 'Iris, Revenue OS is live — what's my gap to $2k?'", minutes: 5 },
    { id: "week", label: "Calendar block 11–15 hrs this week for thumbnails + fulfillment", minutes: 10 },
  ],
};

const byDate = new Map<string, ActivationDayPlan>();
for (const d of REVENUE_ACTIVATION_PREP) byDate.set(d.date, d);
byDate.set(REVENUE_ACTIVATION_GO_LIVE, REVENUE_ACTIVATION_GO_LIVE_PLAN);

export function activationPlanForDate(day: string): ActivationDayPlan | null {
  return byDate.get(day) ?? null;
}

export function activationPrepIndex(day: string): number | null {
  const i = REVENUE_ACTIVATION_PREP.findIndex((d) => d.date === day);
  return i >= 0 ? i + 1 : null;
}

export function activationTaskKey(date: string, taskId: string): string {
  return `${date}:${taskId}`;
}

export function activationProgress(
  day: string,
  done: Record<string, boolean> | undefined,
): { total: number; completed: number } {
  const plan = activationPlanForDate(day);
  if (!plan) return { total: 0, completed: 0 };
  const total = plan.tasks.length;
  const completed = plan.tasks.filter((t) => done?.[activationTaskKey(day, t.id)]).length;
  return { total, completed };
}

/** Days before go-live with a plan (for display). */
export const REVENUE_ACTIVATION_PREP_DAYS = REVENUE_ACTIVATION_PREP.length;