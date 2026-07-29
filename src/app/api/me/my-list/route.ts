import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@db";
import { userListItems } from "@db/schema";
import { getSessionUserId } from "@/lib/auth-server";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ filmIds: [], persisted: false });
  }
  try {
    const rows = await db
      .select()
      .from(userListItems)
      .where(eq(userListItems.userId, userId));
    return NextResponse.json({
      filmIds: rows.map((r) => r.filmId),
      persisted: true,
    });
  } catch {
    return NextResponse.json({ filmIds: [], persisted: false });
  }
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { filmIds?: string[] };
  const filmIds = body.filmIds ?? [];
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }
  try {
    await db.delete(userListItems).where(eq(userListItems.userId, userId));
    if (filmIds.length > 0) {
      await db.insert(userListItems).values(
        filmIds.map((filmId) => ({ userId, filmId })),
      );
    }
    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { filmId?: string };
  if (!body.filmId) {
    return NextResponse.json({ error: "filmId required" }, { status: 400 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }
  try {
    await db
      .insert(userListItems)
      .values({ userId, filmId: body.filmId })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const filmId = searchParams.get("filmId");
  if (!filmId) {
    return NextResponse.json({ error: "filmId required" }, { status: 400 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }
  try {
    await db
      .delete(userListItems)
      .where(
        and(eq(userListItems.userId, userId), eq(userListItems.filmId, filmId)),
      );
    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
