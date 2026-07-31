import { FilmRow } from "@/components/FilmRow";
import { HeroBanner } from "@/components/HeroBanner";
import { getContentRows, getFeaturedFilm } from "@/lib/film-repository";

export default async function HomePage() {
  const [featured, rows] = await Promise.all([
    getFeaturedFilm(),
    getContentRows(),
  ]);

  return (
    <>
      <HeroBanner film={featured} />
      <div className="-mt-8 space-y-10 pb-16 md:-mt-12">
        {rows.map((row) => (
          <FilmRow key={row.id} row={row} />
        ))}
      </div>
    </>
  );
}
