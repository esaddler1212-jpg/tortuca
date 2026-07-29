import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getFilmBySlug } from "@/lib/catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) return { title: "Watch" };
  return { title: `Watch ${film.title}` };
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) notFound();

  return (
    <div className="min-h-screen bg-black pt-4">
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <Link
          href={`/title/${film.slug}`}
          className="mb-4 inline-flex text-sm text-zinc-400 hover:text-white"
        >
          ← Back to {film.title}
        </Link>
        <VideoPlayer src={film.videoUrl} title={film.title} poster={film.backdropUrl} />
        <div className="mt-6">
          <h1 className="font-display text-2xl font-bold text-white">{film.title}</h1>
          <p className="mt-1 text-zinc-400">{film.director}</p>
        </div>
      </div>
    </div>
  );
}
