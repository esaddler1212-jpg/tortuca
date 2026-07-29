import { FilmRow } from "@/components/FilmRow";
import { HeroBanner } from "@/components/HeroBanner";
import { contentRows, getFeaturedFilm } from "@/lib/catalog";

export default function HomePage() {
  const featured = getFeaturedFilm();

  return (
    <>
      <HeroBanner film={featured} />
      <div className="-mt-8 space-y-10 pb-16 md:-mt-12">
        {contentRows.map((row) => (
          <FilmRow key={row.id} row={row} />
        ))}
      </div>
    </>
  );
}
