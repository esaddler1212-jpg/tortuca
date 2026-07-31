import type { DbFilm } from "@db/schema";
import type { Film, Genre, MaturityRating } from "@/types/film";

export function dbFilmToFilm(row: DbFilm): Film {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    synopsis: row.synopsis,
    year: row.year,
    durationMinutes: row.durationMinutes,
    genres: row.genres as Genre[],
    maturity: row.maturity as MaturityRating,
    director: row.director,
    cast: row.cast,
    posterUrl: row.posterUrl,
    backdropUrl: row.backdropUrl,
    videoUrl: row.videoUrl ?? "",
    hlsManifestUrl: row.hlsManifestUrl ?? undefined,
    videoBlobKey: row.videoBlobKey ?? undefined,
    requiresPremium: row.requiresPremium ?? false,
    allowedCountries: row.allowedCountries ?? null,
    featured: row.featured ?? false,
    trendingRank: row.trendingRank ?? undefined,
    awardWinner: row.awardWinner ?? false,
    festival: row.festival ?? undefined,
  };
}

export function filmPlaybackUrl(film: Film): string {
  if (film.hlsManifestUrl) return film.hlsManifestUrl;
  if (film.videoBlobKey) return `/api/stream/${film.slug}`;
  return film.videoUrl;
}

export function isHlsSource(url: string): boolean {
  return url.includes(".m3u8") || url.includes("application/vnd.apple.mpegurl");
}
