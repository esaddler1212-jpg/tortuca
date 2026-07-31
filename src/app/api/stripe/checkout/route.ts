import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@db";
import { subscriptions } from "@db/schema";
import { getStripe, premiumPriceId, PREMIUM_PLAN } from "@/lib/stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const priceId = premiumPriceId();
  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  let customerId: string | undefined;
  const db = getDb();
  if (db) {
    try {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);
      customerId = sub?.stripeCustomerId ?? undefined;
    } catch {
      /* continue */
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;
    if (db) {
      await db
        .insert(subscriptions)
        .values({
          userId,
          stripeCustomerId: customerId,
          status: "inactive",
          plan: "free",
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: { stripeCustomerId: customerId, updatedAt: new Date() },
        });
    }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.URL ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { clerkUserId: userId, plan: PREMIUM_PLAN },
    subscription_data: {
      metadata: { clerkUserId: userId, plan: PREMIUM_PLAN },
    },
  });

  return NextResponse.json({ url: session.url });
}
