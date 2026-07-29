export type Genre =
  | "Drama"
  | "Sci-Fi"
  | "Horror"
  | "Comedy"
  | "Documentary"
  | "Animation"
  | "Romance"
  | "Thriller";

export type MaturityRating = "G" | "PG" | "PG-13" | "R";

export interface Film {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  genres: Genre[];
  maturity: MaturityRating;
  director: string;
  cast: string[];
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  hlsManifestUrl?: string;
  videoBlobKey?: string;
  requiresPremium?: boolean;
  allowedCountries?: string[] | null;
  featured?: boolean;
  trendingRank?: number;
  awardWinner?: boolean;
  festival?: string;
}

export interface ContentRow {
  id: string;
  title: string;
  filmIds: string[];
}
