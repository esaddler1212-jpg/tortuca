import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MyListButton } from "@/components/MyListButton";
import { getFilmBySlug } from "@/lib/catalog";
import { formatDuration } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) return { title: "Not found" };
  return {
    title: film.title,
    description: film.synopsis,
  };
}

export default async function TitlePage({ params }: PageProps) {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) notFound();

  return (
    <div className="pb-16">
      <div className="relative h-[50vh] min-h-[320px] w-full">
        <Image
          src={film.backdropUrl}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/30" />
      </div>
      <div className="relative mx-auto -mt-32 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full max-w-[200px] shrink-0 md:-mt-48">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10">
              <Image
                src={film.posterUrl}
                alt={`${film.title} poster`}
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
          </div>
          <div className="flex-1 space-y-4 pt-4 md:pt-8">
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
              {film.title}
            </h1>
            <p className="text-lg text-accent">{film.tagline}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-xs">
                {film.maturity}
              </span>
              <span>{film.year}</span>
              <span>{formatDuration(film.durationMinutes)}</span>
              {film.festival && (
                <span className="text-accent">{film.festival}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/watch/${film.slug}`}
                className="inline-flex rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200"
              >
                Play
              </Link>
              <MyListButton filmId={film.id} />
            </div>
            <p className="max-w-2xl leading-relaxed text-zinc-300">{film.synopsis}</p>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Director</dt>
                <dd className="text-white">{film.director}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Cast</dt>
                <dd className="text-white">{film.cast.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Genres</dt>
                <dd className="text-white">{film.genres.join(", ")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
