import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/types/film";
import { formatDuration } from "@/lib/utils";

interface HeroBannerProps {
  film: Film;
}

export function HeroBanner({ film }: HeroBannerProps) {
  return (
    <section className="relative min-h-[70vh] w-full overflow-hidden md:min-h-[85vh]">
      <Image
        src={film.backdropUrl}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="absolute inset-0 bg-hero-bottom" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 md:min-h-[85vh] md:pb-24 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-4 md:max-w-2xl">
          {film.festival && (
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              {film.festival} Selection
            </p>
          )}
          <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            {film.title}
          </h1>
          <p className="text-lg text-zinc-300 md:text-xl">{film.tagline}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-xs text-zinc-300">
              {film.maturity}
            </span>
            <span>{film.year}</span>
            <span>{formatDuration(film.durationMinutes)}</span>
            <span>{film.genres.join(" · ")}</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/watch/${film.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200"
            >
              <PlayIcon />
              Play
            </Link>
            <Link
              href={`/title/${film.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-500/40 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-zinc-500/55"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
