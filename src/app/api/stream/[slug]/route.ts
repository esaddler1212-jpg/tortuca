import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStore } from "@netlify/blobs";
import { getFilmBySlug } from "@/lib/film-repository";
import { checkFilmAccess } from "@/lib/access";
import { getViewerCountry, isCountryAllowed } from "@/lib/geo";
import { getSessionUserId, userHasPremium } from "@/lib/auth-server";
import { filmPlaybackUrl } from "@/lib/film-mapper";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const film = await getFilmBySlug(slug);
  if (!film) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viewerCountry = getViewerCountry(request);
  const userId = await getSessionUserId();
  const hasPremium = await userHasPremium(userId);
  const access = checkFilmAccess({
    film,
    isAuthenticated: Boolean(userId),
    hasPremium,
    viewerCountry,
  });
  if (!access.allowed) {
    return NextResponse.json({ error: access.message }, { status: 403 });
  }

  if (!isCountryAllowed(film.allowedCountries, viewerCountry)) {
    return NextResponse.json(
      { error: "Not available in your region." },
      { status: 451 },
    );
  }

  if (film.hlsManifestUrl) {
    return NextResponse.redirect(film.hlsManifestUrl);
  }

  if (!film.videoBlobKey) {
    const external = filmPlaybackUrl(film);
    if (external.startsWith("http")) {
      return NextResponse.redirect(external);
    }
    return NextResponse.json({ error: "No video source" }, { status: 404 });
  }

  try {
    const store = getStore({ name: "tortuca-media", consistency: "strong" });
    const result = await store.getWithMetadata(film.videoBlobKey, {
      type: "arrayBuffer",
    });
    if (!result?.data) {
      return NextResponse.json({ error: "Video missing" }, { status: 404 });
    }

    const buffer = Buffer.from(result.data);
    const contentType =
      (result.metadata?.contentType as string) ?? "video/mp4";
    const size = buffer.length;
    const range = request.headers.get("range");

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (match) {
        const start = Number.parseInt(match[1], 10);
        const end = match[2]
          ? Number.parseInt(match[2], 10)
          : size - 1;
        const chunk = buffer.subarray(start, end + 1);
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(chunk.length),
            "Content-Range": `bytes ${start}-${end}/${size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    if (film.videoUrl) {
      return NextResponse.redirect(film.videoUrl);
    }
    return NextResponse.json(
      { error: "Storage unavailable (use Netlify Blobs in production)" },
      { status: 503 },
    );
  }
}
