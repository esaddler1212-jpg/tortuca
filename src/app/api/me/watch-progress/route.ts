import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@db";
import { watchProgress } from "@db/schema";
import { getSessionUserId } from "@/lib/auth-server";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ progress: {}, persisted: false });
  }
  try {
    const rows = await db
      .select()
      .from(watchProgress)
      .where(eq(watchProgress.userId, userId));
    const progress = Object.fromEntries(
      rows.map((r) => [r.filmId, r.positionSeconds]),
    );
    return NextResponse.json({ progress, persisted: true });
  } catch {
    return NextResponse.json({ progress: {}, persisted: false });
  }
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    filmId?: string;
    positionSeconds?: number;
  };
  if (!body.filmId || body.positionSeconds === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }
  try {
    await db
      .insert(watchProgress)
      .values({
        userId,
        filmId: body.filmId,
        positionSeconds: Math.max(0, Math.floor(body.positionSeconds)),
      })
      .onConflictDoUpdate({
        target: [watchProgress.userId, watchProgress.filmId],
        set: {
          positionSeconds: Math.max(0, Math.floor(body.positionSeconds)),
          updatedAt: new Date(),
        },
      });
    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
