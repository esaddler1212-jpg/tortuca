/**
 * Extra things Iris can see during a conversation: inbox headlines, recent
 * memos, money this month, the gym week and the shopping list. Kept short (it
 * all rides along with every question) and private: email bodies never leave
 * the device, and anything that looks school or family related (students,
 * parents, the district, Family Purpose) is counted, never named, so no
 * student names or details reach the AI.
 */

const SCHOOL =
  /\b(student|students|parent|parents|guardian|iep|504|attendance|absen\w*|tardy|counsel\w*|principal|vice principal|district|usd|k-?12|school|classroom|teacher|field trip|permission slip|conference|report card|grade[sd]?|detention|suspension|referral|behavior|family purpose|middle school|pta|pto)\b/i;
const SCHOOL_DOMAIN = /@[^>]*(\.k12\.|\.edu\b|usd\.|school|district)/i;

/** Would sending this to the AI risk student or family details? */
export function looksSchoolRelated(text: string, extraNames: string[] = []): boolean {
  if (SCHOOL.test(text) || SCHOOL_DOMAIN.test(text)) return true;
  const t = text.toLowerCase();
  return extraNames.some((n) => n.trim().length > 2 && t.includes(n.trim().toLowerCase()));
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** "Jane Doe <jane@x.com>" → "Jane Doe" (never the address). */
function senderName(from: string): string {
  const name = from.replace(/<[^>]*>/, "").trim().replace(/^"(.*)"$/, "$1").trim();
  return name || from.replace(/[<>]/g, "").replace(/@.*/, "").trim();
}

export function inboxContext(
  messages: { from: string; subject: string; date: string; unread: boolean }[],
  timeZone: string,
  opts: { schoolNames?: string[]; limit?: number } = {},
): string {
  if (!messages.length) return "Inbox: nothing new.";
  const limit = opts.limit ?? 8;
  const withheld = messages.filter((m) => looksSchoolRelated(`${m.from} ${m.subject}`, opts.schoolNames));
  const shown = messages
    .filter((m) => !withheld.includes(m))
    .sort((a, b) => Number(b.unread) - Number(a.unread) || b.date.localeCompare(a.date))
    .slice(0, limit);
  const when = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { timeZone, weekday: "short", hour: "numeric", minute: "2-digit" });
  };
  const unread = messages.filter((m) => m.unread).length;
  const lines = shown.map((m) => `${m.unread ? "[unread] " : ""}${clip(senderName(m.from), 40)}: "${clip(m.subject || "(no subject)", 80)}" (${when(m.date)})`);
  const held = withheld.length ? ` Plus ${withheld.length} school or family email${withheld.length === 1 ? "" : "s"} (details withheld).` : "";
  return `Inbox (newest ${messages.length}, ${unread} unread; senders and subjects only, not the email text): ${lines.join("; ") || "nothing else"}.${held}`;
}

export function memosContext(memos: { at: string; text: string }[], timeZone: string, opts: { schoolNames?: string[]; limit?: number } = {}): string {
  const real = memos.filter((m) => !/^Conversation with Iris/.test(m.text));
  if (!real.length) return "";
  const recent = real.slice(0, opts.limit ?? 5);
  const withheld = recent.filter((m) => looksSchoolRelated(m.text, opts.schoolNames)).length;
  const lines = recent
    .filter((m) => !looksSchoolRelated(m.text, opts.schoolNames))
    .map((m) => `(${new Date(m.at).toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric" })}) ${clip(m.text.replace(/\s+/g, " ").trim(), 140)}`);
  const held = withheld ? ` Plus ${withheld} school-related memo${withheld === 1 ? "" : "s"} (withheld).` : "";
  return lines.length || withheld ? `Recent memos: ${lines.join(" | ") || "none to share"}.${held}` : "";
}

export function moneyContext(m: { income: number; spent: number; net: number; ecsRevenue: number; topSpend: [string, number][] }, monthLabel: string, revenueGoal?: number): string {
  if (!m.income && !m.spent) return `Money (${monthLabel}): nothing logged yet.`;
  const top = m.topSpend.length ? ` Top spending: ${m.topSpend.map(([c, n]) => `${c} ${money(n)}`).join(", ")}.` : "";
  const goal = revenueGoal ? ` ECS revenue ${money(m.ecsRevenue)} of ${money(revenueGoal)} goal.` : ` ECS revenue ${money(m.ecsRevenue)}.`;
  return `Money (${monthLabel}, from the Money tab): in ${money(m.income)}, out ${money(m.spent)}, net ${money(m.net)}.${goal}${top}`;
}

export function gymContext(g: { workoutsThisWeek: number; target: number; loggedToday: boolean; next?: { title: string; day: string; isToday: boolean } | null }): string {
  const next = g.next ? ` Next session: ${g.next.title} ${g.next.isToday ? "today" : `on ${g.next.day}`}.` : "";
  return `Gym: ${g.workoutsThisWeek} of ${g.target} workouts this week${g.loggedToday ? ", logged today" : ""}.${next}`;
}

export function shoppingContext(items: { name: string; inPantry: boolean }[]): string {
  const need = items.filter((i) => !i.inPantry).map((i) => i.name.trim()).filter(Boolean);
  if (!need.length) return "Shopping list: empty.";
  return `Shopping list (${need.length}): ${need.slice(0, 25).map((n) => clip(n, 30)).join(", ")}${need.length > 25 ? ", …" : ""}.`;
}

/** AI & drone watchlist (Hub Money tab / Finnhub). */
export function stocksContext(snapshot: {
  watchlist: { symbol: string; changePercent: number; theme: string }[];
  upcomingIpos: { name: string; symbol: string; date: string }[];
  dataSource?: string;
  demoFallback?: boolean;
} | null | undefined): string {
  if (!snapshot?.watchlist?.length) return "";
  const movers = [...snapshot.watchlist]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 3)
    .map((m) => `${m.symbol} ${m.changePercent >= 0 ? "up" : "down"} ${Math.abs(m.changePercent).toFixed(1)}%`);
  const ipo = snapshot.upcomingIpos[0];
  const ipoLine = ipo ? ` IPO watch: ${ipo.name} (${ipo.symbol}) ~${ipo.date}.` : "";
  const demo = snapshot.dataSource === "demo" || snapshot.demoFallback ? " (demo quotes)" : "";
  return `Markets (Money tab watchlist)${demo}: ${movers.join(", ")}.${ipoLine}`;
}
