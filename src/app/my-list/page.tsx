"use client";

import Link from "next/link";
import { FilmPoster } from "@/components/FilmPoster";
import { getFilmById } from "@/lib/catalog";
import { useMyList } from "@/hooks/useMyList";

export default function MyListPage() {
  const { ids, ready } = useMyList();
  const films = ids
    .map((id) => getFilmById(id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-white">My List</h1>
      <p className="mt-2 text-zinc-400">
        Saved for later — stored on this device until you sign in (coming soon).
      </p>

      {!ready ? (
        <p className="mt-12 text-zinc-500">Loading…</p>
      ) : films.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-zinc-500">Your list is empty.</p>
          <Link
            href="/browse"
            className="mt-4 inline-flex text-accent hover:underline"
          >
            Browse films
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {films.map((film) => (
            <FilmPoster key={film.id} film={film} />
          ))}
        </div>
      )}
    </div>
  );
}
