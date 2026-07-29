import { filmsForRow } from "@/lib/film-repository";
import { FilmPoster } from "@/components/FilmPoster";
import type { ContentRow } from "@/types/film";

interface FilmRowProps {
  row: ContentRow;
}

export async function FilmRow({ row }: FilmRowProps) {
  const items = await filmsForRow(row);
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-4 text-lg font-semibold text-white sm:px-6 lg:px-8">
        {row.title}
      </h2>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-6 lg:px-8">
          {items.map((film) => (
            <div key={film.id} className="w-[140px] shrink-0 sm:w-[160px] md:w-[180px]">
              <FilmPoster film={film} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
