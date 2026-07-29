import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb } from "@db";
import { subscriptions } from "@db/schema";
import { getStripe, PREMIUM_PLAN } from "@/lib/stripe";

export const runtime = "nodejs";

async function upsertSubscription(options: {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: string;
  plan: string;
  periodEnd: Date | null;
}) {
  const db = getDb();
  if (db) {
    await db
      .insert(subscriptions)
      .values({
        userId: options.userId,
        stripeCustomerId: options.customerId,
        stripeSubscriptionId: options.subscriptionId,
        status: options.status,
        plan: options.plan,
        currentPeriodEnd: options.periodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          stripeCustomerId: options.customerId,
          stripeSubscriptionId: options.subscriptionId,
          status: options.status,
          plan: options.plan,
          currentPeriodEnd: options.periodEnd,
          updatedAt: new Date(),
        },
      });
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(options.userId, {
    publicMetadata: {
      plan: options.status === "active" ? options.plan : "free",
      stripeStatus: options.status,
    },
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.clerkUserId;
      if (!userId) break;
      await upsertSubscription({
        userId,
        customerId:
          typeof session.customer === "string" ? session.customer : null,
        subscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : null,
        status: "active",
        plan: session.metadata?.plan ?? PREMIUM_PLAN,
        periodEnd: null,
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.clerkUserId;
      if (!userId) break;
      const active = sub.status === "active" || sub.status === "trialing";
      const periodUnix =
        "current_period_end" in sub &&
        typeof (sub as { current_period_end: unknown }).current_period_end ===
          "number"
          ? (sub as { current_period_end: number }).current_period_end
          : null;
      await upsertSubscription({
        userId,
        customerId:
          typeof sub.customer === "string" ? sub.customer : null,
        subscriptionId: sub.id,
        status: sub.status,
        plan: active ? PREMIUM_PLAN : "free",
        periodEnd: periodUnix ? new Date(periodUnix * 1000) : null,
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
