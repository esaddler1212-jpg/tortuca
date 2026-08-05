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
  watchlist: StockQuote[];
  upcomingIpos: IpoCandidate[];
}
