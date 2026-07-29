import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/types/film";
import { cn } from "@/lib/utils";

interface FilmPosterProps {
  film: Film;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function FilmPoster({
  film,
  priority,
  className,
  sizes = "(max-width: 768px) 40vw, 200px",
}: FilmPosterProps) {
  return (
    <Link
      href={`/title/${film.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-md bg-surface-card ring-1 ring-white/5 transition duration-300 hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-black/60 hover:ring-white/20",
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={film.posterUrl}
          alt={`${film.title} poster`}
          fill
          className="object-cover transition duration-500 group-hover:brightness-110"
          sizes={sizes}
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <p className="absolute bottom-2 left-2 right-2 translate-y-2 text-xs font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          {film.title}
        </p>
      </div>
    </Link>
  );
}
