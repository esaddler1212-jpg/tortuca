import type { Handler } from "@netlify/functions";
import {
  AI_WATCHLIST,
  DRONE_WATCHLIST,
  ipoMatchesTechThemes,
} from "./_stocks-config";

interface FinnhubQuote {
  c: number;
  d: number;
  dp: number;
  pc: number;
}

interface FinnhubIpo {
  date: string;
  exchange: string;
  name: string;
  numberOfShares?: number;
  price?: string;
  status: string;
  symbol: string;
  totalSharesValue?: number;
}

function demoSnapshot() {
  const now = new Date().toISOString();
  return {
    fetchedAt: now,
    dataSource: "demo" as const,
    watchlist: [
      { symbol: "NVDA", name: "NVIDIA", theme: "ai", price: 128.5, change: 2.4, changePercent: 1.9, previousClose: 126.1 },
      { symbol: "PLTR", name: "Palantir", theme: "ai", price: 28.2, change: -0.35, changePercent: -1.22, previousClose: 28.55 },
      { symbol: "AVAV", name: "AeroVironment", theme: "drones", price: 198.0, change: 3.1, changePercent: 1.59, previousClose: 194.9 },
      { symbol: "RCAT", name: "Red Cat Holdings", theme: "drones", price: 8.42, change: 0.18, changePercent: 2.18, previousClose: 8.24 },
    ],
    upcomingIpos: [
      {
        symbol: "AIDG",
        name: "Aidronix AI Systems",
        date: formatDay(offsetDays(12)),
        exchange: "NASDAQ",
        priceRange: "$18–$20",
        status: "expected",
        themes: ["ai"],
      },
      {
        symbol: "SKYD",
        name: "Skyward Drone Logistics",
        date: formatDay(offsetDays(21)),
        exchange: "NYSE",
        priceRange: "$14–$16",
        status: "expected",
        themes: ["drones"],
      },
    ],
  };
}

function offsetDays(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchQuote(
  token: string,
  symbol: string,
  name: string,
  theme: "ai" | "drones",
) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
  );
  if (!res.ok) return null;
  const q = (await res.json()) as FinnhubQuote;
  if (!q.c) return null;
  return {
    symbol,
    name,
    theme,
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    previousClose: q.pc ?? q.c,
  };
}

export const handler: Handler = async () => {
  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!token) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "X-Stocks-Source": "demo" },
      body: JSON.stringify(demoSnapshot()),
    };
  }

  try {
    const watchlistEntries = [
      ...AI_WATCHLIST.map((s) => ({ ...s, theme: "ai" as const })),
      ...DRONE_WATCHLIST.map((s) => ({ ...s, theme: "drones" as const })),
    ];

    const quotes = await Promise.all(
      watchlistEntries.map((s) => fetchQuote(token, s.symbol, s.name, s.theme)),
    );
    const watchlist = quotes.filter(Boolean);

    const from = formatDay(new Date());
    const to = formatDay(offsetDays(60));
    const ipoRes = await fetch(
      `https://finnhub.io/api/v1/calendar/ipo?from=${from}&to=${to}&token=${token}`,
    );
    let upcomingIpos: Array<{
      symbol: string;
      name: string;
      date: string;
      exchange: string;
      priceRange?: string;
      status: string;
      themes: Array<"ai" | "drones">;
    }> = [];

    if (ipoRes.ok) {
      const ipoData = (await ipoRes.json()) as { ipoCalendar?: FinnhubIpo[] };
      upcomingIpos = (ipoData.ipoCalendar ?? [])
        .map((ipo) => {
          const themes = ipoMatchesTechThemes(ipo.name, ipo.symbol);
          return {
            symbol: ipo.symbol,
            name: ipo.name,
            date: ipo.date,
            exchange: ipo.exchange,
            priceRange: ipo.price,
            status: ipo.status,
            themes,
          };
        })
        .filter((ipo) => ipo.themes.length > 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 12);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "X-Stocks-Source": "finnhub" },
      body: JSON.stringify({
        fetchedAt: new Date().toISOString(),
        dataSource: "finnhub",
        watchlist,
        upcomingIpos,
      }),
    };
  } catch {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "X-Stocks-Source": "demo" },
      body: JSON.stringify(demoSnapshot()),
    };
  }
};
