import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@db";
import { subscriptions } from "@db/schema";
import { eq } from "drizzle-orm";
import { PREMIUM_PLAN } from "@/lib/stripe";

export function clerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export async function getSessionUserId(): Promise<string | null> {
  if (!clerkConfigured()) return null;
  const { userId } = await auth();
  return userId;
}

export function parseAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export async function isAdminUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const admins = parseAdminUserIds();
  if (admins.has(userId)) return true;
  const user = await currentUser();
  return user?.publicMetadata?.role === "admin";
}

export async function userHasPremium(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await currentUser();
  if (user?.publicMetadata?.plan === PREMIUM_PLAN) return true;

  const db = getDb();
  if (!db) {
    return user?.publicMetadata?.plan === PREMIUM_PLAN;
  }

  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    return sub?.status === "active" && sub.plan === PREMIUM_PLAN;
  } catch {
    return false;
  }
}
