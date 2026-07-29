import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { films as filmsTable } from "@db/schema";
import { getDb } from "@db";
import { isAdminUser, getSessionUserId } from "@/lib/auth-server";
import { films as seedFilms } from "@/lib/catalog";
import type { NewDbFilm } from "@db/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as Partial<NewDbFilm> & {
    seedFromCatalog?: boolean;
  };

  if (body.seedFromCatalog) {
    for (const film of seedFilms) {
      await db
        .insert(filmsTable)
        .values({
          id: film.id,
          slug: film.slug,
          title: film.title,
          tagline: film.tagline,
          synopsis: film.synopsis,
          year: film.year,
          durationMinutes: film.durationMinutes,
          genres: film.genres,
          maturity: film.maturity,
          director: film.director,
          cast: film.cast,
          posterUrl: film.posterUrl,
          backdropUrl: film.backdropUrl,
          videoUrl: film.videoUrl,
          featured: film.featured ?? false,
          trendingRank: film.trendingRank ?? null,
          awardWinner: film.awardWinner ?? false,
          festival: film.festival ?? null,
          requiresPremium: film.requiresPremium ?? false,
          allowedCountries: film.allowedCountries ?? null,
        })
        .onConflictDoNothing();
    }
    return NextResponse.json({ ok: true, seeded: seedFilms.length });
  }

  if (!body.id || !body.slug || !body.title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(filmsTable)
    .values({
      id: body.id,
      slug: body.slug,
      title: body.title,
      tagline: body.tagline ?? "",
      synopsis: body.synopsis ?? "",
      year: body.year ?? new Date().getFullYear(),
      durationMinutes: body.durationMinutes ?? 10,
      genres: body.genres ?? [],
      maturity: body.maturity ?? "PG",
      director: body.director ?? "Unknown",
      cast: body.cast ?? [],
      posterUrl: body.posterUrl ?? "",
      backdropUrl: body.backdropUrl ?? "",
      videoUrl: body.videoUrl ?? null,
      videoBlobKey: body.videoBlobKey ?? null,
      hlsManifestUrl: body.hlsManifestUrl ?? null,
      requiresPremium: body.requiresPremium ?? false,
      allowedCountries: body.allowedCountries ?? null,
    })
    .returning();

  return NextResponse.json({ film: created });
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const slug = String(form.get("slug") ?? "");
  const file = form.get("file");

  if (!slug || !(file instanceof File)) {
    return NextResponse.json({ error: "slug and file required" }, { status: 400 });
  }

  const key = `videos/${slug}/${file.name}`;
  const arrayBuffer = await file.arrayBuffer();

  try {
    const store = getStore({ name: "tortuca-media", consistency: "strong" });
    await store.set(key, arrayBuffer, {
      metadata: {
        contentType: file.type || "video/mp4",
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Blob storage unavailable (deploy on Netlify or use netlify dev)" },
      { status: 503 },
    );
  }

  const db = getDb();
  if (db) {
    const { eq } = await import("drizzle-orm");
    await db
      .update(filmsTable)
      .set({ videoBlobKey: key, updatedAt: new Date() })
      .where(eq(filmsTable.slug, slug));
  }

  return NextResponse.json({
    ok: true,
    blobKey: key,
    streamUrl: `/api/stream/${slug}`,
    note: "For HLS, upload a .m3u8 manifest URL via admin form or transcode with your CDN pipeline.",
  });
}
