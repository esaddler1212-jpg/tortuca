import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@db";
import { subscriptions } from "@db/schema";
import { getSessionUserId, userHasPremium } from "@/lib/auth-server";
import { PREMIUM_PLAN } from "@/lib/stripe";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const hasPremium = await userHasPremium(userId);
  const db = getDb();
  if (!db) {
    return NextResponse.json({
      plan: hasPremium ? PREMIUM_PLAN : "free",
      status: hasPremium ? "active" : "inactive",
      persisted: false,
    });
  }
  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    return NextResponse.json({
      plan: sub?.plan ?? (hasPremium ? PREMIUM_PLAN : "free"),
      status: sub?.status ?? "inactive",
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      persisted: true,
    });
  } catch {
    return NextResponse.json({
      plan: hasPremium ? PREMIUM_PLAN : "free",
      status: hasPremium ? "active" : "inactive",
      persisted: false,
    });
  }
}
