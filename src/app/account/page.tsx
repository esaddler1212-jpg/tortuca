"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountPage() {
  const [sub, setSub] = useState<{
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/me/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSub(data);
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-24">
      <h1 className="font-display text-3xl font-bold text-white">Account</h1>
      <p className="mt-2 text-zinc-400">
        Manage your profile via the avatar menu. Subscription status syncs from
        Stripe.
      </p>

      <section className="mt-8 rounded-xl border border-zinc-800 bg-surface-raised p-6">
        <h2 className="font-semibold text-white">Membership</h2>
        {sub ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Plan</dt>
              <dd className="capitalize text-white">{sub.plan}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Status</dt>
              <dd className="capitalize text-white">{sub.status}</dd>
            </div>
            {sub.currentPeriodEnd && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Renews</dt>
                <dd className="text-white">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        )}
        <Link
          href="/pricing"
          className="mt-6 inline-flex text-sm text-accent hover:underline"
        >
          Change plan
        </Link>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-800 bg-surface-raised p-6">
        <h2 className="font-semibold text-white">Profiles</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Multi-profile households (kids, shared devices) are next — Clerk user
          metadata will drive profile switching like major streamers.
        </p>
      </section>
    </div>
  );
}
