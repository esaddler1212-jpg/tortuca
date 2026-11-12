export type StockTheme = "ai" | "drones";

export interface StockQuote {
  symbol: string;
  name: string;
  theme: StockTheme;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
}

export interface IpoCandidate {
  symbol: string;
  name: string;
  date: string;
  exchange: string;
  priceRange?: string;
  status: string;
  themes: StockTheme[];
}

export interface StocksSnapshot {
  fetchedAt: string;
  dataSource: "finnhub" | "demo";
  /** Present when live Finnhub fetch failed but demo numbers are included. */
  demoFallback?: boolean;
  error?: string;
  watchlist: StockQuote[];
  upcomingIpos: IpoCandidate[];
}
