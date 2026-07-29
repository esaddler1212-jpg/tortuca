import Link from "next/link";
import { FilmPoster } from "@/components/FilmPoster";
import { getAllFilms } from "@/lib/film-repository";
import type { Genre } from "@/types/film";

const genres: Genre[] = [
  "Drama",
  "Sci-Fi",
  "Horror",
  "Comedy",
  "Documentary",
  "Animation",
  "Romance",
  "Thriller",
];

export default async function BrowsePage() {
  const films = await getAllFilms();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-white">Browse</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Explore the catalog by genre. Premium and regional titles are labeled on
        each film&apos;s detail page.
      </p>

      <div className="mt-10 flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link
            key={genre}
            href={`/search?q=${encodeURIComponent(genre)}`}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-accent hover:text-accent"
          >
            {genre}
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold text-white">All shorts</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {films.map((film) => (
          <FilmPoster key={film.id} film={film} />
        ))}
      </div>
    </div>
  );
}
