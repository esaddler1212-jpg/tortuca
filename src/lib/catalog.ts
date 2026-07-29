import type { ContentRow, Film } from "@/types/film";

const sampleVideo =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const films: Film[] = [
  {
    id: "1",
    slug: "last-light-on-mars",
    title: "Last Light on Mars",
    tagline: "When the signal fades, what remains is memory.",
    synopsis:
      "A stranded technician at a remote relay station records one final transmission for Earth as dust storms erase the horizon. A quiet meditation on distance, duty, and the stories we send into the void.",
    year: 2025,
    durationMinutes: 14,
    genres: ["Sci-Fi", "Drama"],
    maturity: "PG-13",
    director: "Maya Okonkwo",
    cast: ["Jordan Lee", "Sofia Ruiz"],
    posterUrl:
      "https://images.unsplash.com/photo-1614728894747-a83421e2f327?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1614728894747-a83421e2f327?w=1920&q=80",
    videoUrl: sampleVideo,
    featured: true,
    trendingRank: 1,
    awardWinner: true,
    festival: "Sundance",
    requiresPremium: false,
  },
  {
    id: "2",
    slug: "paper-cranes",
    title: "Paper Cranes",
    tagline: "Every fold holds a promise.",
    synopsis:
      "After inheriting her grandmother's apartment, a musician discovers hundreds of origami cranes—and the unsent letters tucked inside them. A lyrical romance about inheritance and second chances.",
    year: 2024,
    durationMinutes: 18,
    genres: ["Romance", "Drama"],
    maturity: "PG",
    director: "Elena Vasquez",
    cast: ["Amir Hassan", "Chloe Park"],
    posterUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    trendingRank: 2,
    awardWinner: true,
    festival: "SXSW",
  },
  {
    id: "3",
    slug: "the-night-shift",
    title: "The Night Shift",
    tagline: "Something is stocking the shelves.",
    synopsis:
      "A convenience-store clerk working alone after midnight notices items rearranging themselves. A tight, playful horror short that turns fluorescent aisles into a maze.",
    year: 2025,
    durationMinutes: 11,
    genres: ["Horror", "Thriller"],
    maturity: "R",
    director: "Devon Walsh",
    cast: ["Taylor Brooks", "Riley Chen"],
    posterUrl:
      "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    trendingRank: 3,
  },
  {
    id: "4",
    slug: "laugh-track",
    title: "Laugh Track",
    tagline: "The audience is always right.",
    synopsis:
      "A washed-up sitcom writer is haunted by a laugh track only she can hear. A meta-comedy about creativity, cancellation, and the punchline you can't unhear.",
    year: 2024,
    durationMinutes: 9,
    genres: ["Comedy"],
    maturity: "PG-13",
    director: "Sam Okafor",
    cast: ["Priya Nair", "Marcus Bell"],
    posterUrl:
      "https://images.unsplash.com/photo-1522868195601-1308d0753176?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1522868195601-1308d0753176?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    trendingRank: 4,
  },
  {
    id: "5",
    slug: "tide-lines",
    title: "Tide Lines",
    tagline: "The ocean keeps what we throw away.",
    synopsis:
      "Fisherfolk on a shrinking coast document plastic tides and ancestral songs in parallel. An intimate documentary short on climate, craft, and community.",
    year: 2025,
    durationMinutes: 22,
    genres: ["Documentary"],
    maturity: "G",
    director: "Hana Mehta",
    cast: ["Community voices"],
    posterUrl:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    awardWinner: true,
    festival: "Tribeca",
    requiresPremium: true,
  },
  {
    id: "6",
    slug: "wireframe",
    title: "Wireframe",
    tagline: "Rendered feelings.",
    synopsis:
      "In a city where emotions appear as low-poly overlays, a game artist learns to see in full color again. Stylized animation with a tender core.",
    year: 2024,
    durationMinutes: 12,
    genres: ["Animation", "Drama"],
    maturity: "PG",
    director: "Yuki Tanaka",
    cast: ["Voice: Aiko Mori"],
    posterUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    trendingRank: 5,
  },
  {
    id: "7",
    slug: "exit-interview",
    title: "Exit Interview",
    tagline: "Please rate your afterlife.",
    synopsis:
      "A corporate HR rep processes departures—for souls. Deadpan satire about burnout that follows you everywhere.",
    year: 2025,
    durationMinutes: 8,
    genres: ["Comedy", "Sci-Fi"],
    maturity: "PG-13",
    director: "Leo Fernández",
    cast: ["Nina Kowalski", "Chris Adeyemi"],
    posterUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "8",
    slug: "still-waters",
    title: "Still Waters",
    tagline: "Don't look down.",
    synopsis:
      "Two siblings on a diving trip discover a submerged village—and disagree on whether to surface the truth. Slow-burn thriller in crystal-clear depths.",
    year: 2024,
    durationMinutes: 16,
    genres: ["Thriller", "Drama"],
    maturity: "R",
    director: "Ingrid Holm",
    cast: ["Mae Lindström", "Jonas Pike"],
    posterUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    trendingRank: 6,
    requiresPremium: true,
    allowedCountries: ["US", "CA", "GB"],
  },
];

export const contentRows: ContentRow[] = [
  {
    id: "trending",
    title: "Trending Now",
    filmIds: [...films]
      .filter((f) => f.trendingRank)
      .sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99))
      .map((f) => f.id),
  },
  {
    id: "award-winners",
    title: "Festival Favorites",
    filmIds: films.filter((f) => f.awardWinner).map((f) => f.id),
  },
  {
    id: "sci-fi",
    title: "Sci-Fi & Future",
    filmIds: films.filter((f) => f.genres.includes("Sci-Fi")).map((f) => f.id),
  },
  {
    id: "animation",
    title: "Animated Shorts",
    filmIds: films
      .filter((f) => f.genres.includes("Animation"))
      .map((f) => f.id),
  },
  {
    id: "quick-bites",
    title: "Under 12 Minutes",
    filmIds: films.filter((f) => f.durationMinutes < 12).map((f) => f.id),
  },
];

export function getFilmBySlug(slug: string): Film | undefined {
  return films.find((f) => f.slug === slug);
}

export function getFilmById(id: string): Film | undefined {
  return films.find((f) => f.id === id);
}

export function getFeaturedFilm(): Film {
  return films.find((f) => f.featured) ?? films[0];
}

export function searchFilms(query: string): Film[] {
  const q = query.trim().toLowerCase();
  if (!q) return films;
  return films.filter(
    (f) =>
      f.title.toLowerCase().includes(q) ||
      f.synopsis.toLowerCase().includes(q) ||
      f.director.toLowerCase().includes(q) ||
      f.genres.some((g) => g.toLowerCase().includes(q)),
  );
}

export function filmsForRow(row: ContentRow): Film[] {
  return row.filmIds
    .map((id) => getFilmById(id))
    .filter((f): f is Film => Boolean(f));
}
