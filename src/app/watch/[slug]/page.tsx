import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WatchExperience } from "@/components/WatchExperience";
import { checkFilmAccess } from "@/lib/access";
import { getSessionUserId, userHasPremium } from "@/lib/auth-server";
import { filmPlaybackUrl } from "@/lib/film-mapper";
import { headers } from "next/headers";
import { getFilmBySlug } from "@/lib/film-repository";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const film = await getFilmBySlug(slug);
  if (!film) return { title: "Watch" };
  return { title: `Watch ${film.title}` };
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;
  const film = await getFilmBySlug(slug);
  if (!film) notFound();

  const headerList = await headers();
  const viewerCountry =
    headerList.get("x-nf-geo-country") ??
    headerList.get("cf-ipcountry") ??
    null;
  const userId = await getSessionUserId();
  const hasPremium = await userHasPremium(userId);
  const access = checkFilmAccess({
    film,
    isAuthenticated: Boolean(userId),
    hasPremium,
    viewerCountry,
  });

  const playback = filmPlaybackUrl(film);
  let initialPosition = 0;
  if (userId) {
    const db = (await import("@db")).getDb();
    if (db) {
      try {
        const { watchProgress } = await import("@db/schema");
        const { and, eq } = await import("drizzle-orm");
        const [row] = await db
          .select()
          .from(watchProgress)
          .where(
            and(
              eq(watchProgress.userId, userId),
              eq(watchProgress.filmId, film.id),
            ),
          )
          .limit(1);
        initialPosition = row?.positionSeconds ?? 0;
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="min-h-screen bg-black pt-4">
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <Link
          href={`/title/${film.slug}`}
          className="mb-4 inline-flex text-sm text-zinc-400 hover:text-white"
        >
          ← Back to {film.title}
        </Link>
        {!access.allowed ? (
          <div className="rounded-lg border border-zinc-800 bg-surface-raised p-8 text-center">
            <p className="text-lg text-white">{access.message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {access.reason === "sign_in" && (
                <Link
                  href="/sign-in"
                  className="rounded-md bg-white px-5 py-2 text-sm font-bold text-black"
                >
                  Sign in
                </Link>
              )}
              {(access.reason === "premium" || access.reason === "sign_in") && (
                <Link
                  href="/pricing"
                  className="rounded-md bg-accent px-5 py-2 text-sm font-bold text-surface"
                >
                  View plans
                </Link>
              )}
              {access.reason === "geo" && (
                <Link href="/browse" className="text-accent hover:underline">
                  Browse available titles
                </Link>
              )}
            </div>
          </div>
        ) : (
          <WatchExperience
            filmId={film.id}
            title={film.title}
            director={film.director}
            poster={film.backdropUrl}
            src={playback}
            initialPosition={initialPosition}
          />
        )}
      </div>
    </div>
  );
}
