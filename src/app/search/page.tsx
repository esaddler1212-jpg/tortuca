import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";
import { getAllFilms } from "@/lib/film-repository";

export default async function SearchPage() {
  const films = await getAllFilms();
  return (
    <Suspense fallback={<div className="px-4 pt-24 text-zinc-500">Loading search…</div>}>
      <SearchPageClient initialFilms={films} />
    </Suspense>
  );
}
