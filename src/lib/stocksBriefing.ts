import type { StocksSnapshot } from "../types/stocks";

export function stocksBriefingLines(snapshot: StocksSnapshot | null): string[] {
  if (!snapshot) return [];

  const lines: string[] = [];
  const ai = snapshot.watchlist.filter((q) => q.theme === "ai");
  const drones = snapshot.watchlist.filter((q) => q.theme === "drones");

  const movers = [...snapshot.watchlist]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 2);

  if (movers.length > 0) {
    const parts = movers.map(
      (m) =>
        `${m.symbol} ${m.changePercent >= 0 ? "up" : "down"} ${Math.abs(m.changePercent).toFixed(1)}%`,
    );
    lines.push(`Markets: ${parts.join(", ")} among your AI and drone watchlist.`);
  }

  if (snapshot.upcomingIpos.length > 0) {
    const next = snapshot.upcomingIpos[0];
    const more =
      snapshot.upcomingIpos.length > 1
        ? ` plus ${snapshot.upcomingIpos.length - 1} more tech IPO${snapshot.upcomingIpos.length === 2 ? "" : "s"} on the radar`
        : "";
    lines.push(
      `Upcoming IPO watch: ${next.name} (${next.symbol}) around ${next.date}${more}.`,
    );
  } else if (ai.length + drones.length > 0) {
    lines.push(
      `Tracking ${ai.length} AI and ${drones.length} drone names; no matching IPOs in the next 60 days.`,
    );
  }

  if (snapshot.dataSource === "demo") {
    lines.push("(Market data is in demo mode — add FINNHUB_API_KEY for live quotes.)");
  }

  return lines;
}
