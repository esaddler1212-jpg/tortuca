import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const PREMIUM_PLAN = "premium";

export function premiumPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID_PREMIUM ?? null;
}
