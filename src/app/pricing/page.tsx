"use client";

import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Checkout unavailable");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Could not start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">Choose your plan</h1>
      <p className="mt-2 text-zinc-400">
        Stream festival shorts on any device. Cancel anytime.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-surface-raised p-6">
          <h2 className="text-lg font-semibold text-white">Free</h2>
          <p className="mt-1 text-3xl font-bold text-white">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li>Ad-supported catalog sampling</li>
            <li>My List on this account</li>
            <li>Watch progress sync</li>
          </ul>
        </div>
        <div className="rounded-xl border border-accent/40 bg-surface-raised p-6 ring-1 ring-accent/20">
          <h2 className="text-lg font-semibold text-accent">Premium</h2>
          <p className="mt-1 text-3xl font-bold text-white">
            $7.99<span className="text-base font-normal text-zinc-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li>Full catalog including festival exclusives</li>
            <li>Early access uploads</li>
            <li>HD streaming via CDN / HLS</li>
          </ul>
          <button
            type="button"
            disabled={loading}
            onClick={() => void startCheckout()}
            className="mt-6 w-full rounded-md bg-accent py-2.5 text-sm font-bold text-surface hover:bg-accent-muted disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Subscribe with Stripe"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
