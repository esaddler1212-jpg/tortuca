"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilmPoster } from "@/components/FilmPoster";
import { films, searchFilms } from "@/lib/catalog";

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  const results = useMemo(() => searchFilms(query), [query]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-white">Search</h1>
      <p className="mt-2 text-zinc-400">
        Find shorts by title, genre, director, or keyword.
      </p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try sci-fi, festival, comedy…"
        className="mt-6 w-full max-w-xl rounded-lg border border-zinc-700 bg-surface-raised px-4 py-3 text-white placeholder:text-zinc-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        autoFocus
      />
      <p className="mt-4 text-sm text-zinc-500">
        {query.trim()
          ? `${results.length} result${results.length === 1 ? "" : "s"}`
          : `Showing all ${films.length} titles`}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {results.map((film) => (
          <FilmPoster key={film.id} film={film} />
        ))}
      </div>
      {results.length === 0 && (
        <p className="mt-12 text-center text-zinc-500">No films match your search.</p>
      )}
    </div>
  );
}
