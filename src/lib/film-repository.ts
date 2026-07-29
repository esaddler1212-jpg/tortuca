import { getDb } from "@db";
import { films as filmsTable } from "@db/schema";
import { asc, eq } from "drizzle-orm";
import {
  contentRows,
  films as seedFilms,
  getFeaturedFilm as getSeedFeatured,
  getFilmById as getSeedById,
  getFilmBySlug as getSeedBySlug,
  searchFilms as searchSeed,
} from "@/lib/catalog";
import { dbFilmToFilm } from "@/lib/film-mapper";
import type { Film } from "@/types/film";
import type { ContentRow } from "@/types/film";

async function loadFromDb(): Promise<Film[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const rows = await db.select().from(filmsTable).orderBy(asc(filmsTable.title));
    if (rows.length === 0) return null;
    return rows.map(dbFilmToFilm);
  } catch {
    return null;
  }
}

export async function getAllFilms(): Promise<Film[]> {
  const fromDb = await loadFromDb();
  return fromDb ?? seedFilms;
}

export async function getFilmBySlug(slug: string): Promise<Film | undefined> {
  const db = getDb();
  if (db) {
    try {
      const [row] = await db
        .select()
        .from(filmsTable)
        .where(eq(filmsTable.slug, slug))
        .limit(1);
      if (row) return dbFilmToFilm(row);
    } catch {
      /* fallback */
    }
  }
  return getSeedBySlug(slug);
}

export async function getFilmById(id: string): Promise<Film | undefined> {
  const db = getDb();
  if (db) {
    try {
      const [row] = await db
        .select()
        .from(filmsTable)
        .where(eq(filmsTable.id, id))
        .limit(1);
      if (row) return dbFilmToFilm(row);
    } catch {
      /* fallback */
    }
  }
  return getSeedById(id);
}

export async function getFeaturedFilm(): Promise<Film> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.select().from(filmsTable);
      const featured = rows.find((r) => r.featured) ?? rows[0];
      if (featured) return dbFilmToFilm(featured);
    } catch {
      /* fallback */
    }
  }
  return getSeedFeatured();
}

export async function searchFilms(query: string): Promise<Film[]> {
  const all = await getAllFilms();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (f) =>
      f.title.toLowerCase().includes(q) ||
      f.synopsis.toLowerCase().includes(q) ||
      f.director.toLowerCase().includes(q) ||
      f.genres.some((g) => g.toLowerCase().includes(q)),
  );
}

export async function getContentRows(): Promise<ContentRow[]> {
  const all = await getAllFilms();
  return contentRows.map((row) => ({
    ...row,
    filmIds: row.filmIds.filter((id) => all.some((f) => f.id === id)),
  }));
}

export async function filmsForRow(row: ContentRow): Promise<Film[]> {
  const all = await getAllFilms();
  const byId = new Map(all.map((f) => [f.id, f]));
  return row.filmIds.map((id) => byId.get(id)).filter((f): f is Film => Boolean(f));
}
