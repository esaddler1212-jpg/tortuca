import {
  isBackendConfigured,
  listPosts,
  listSubmissions,
  listOrders,
} from '@/lib/store'

export const dynamic = 'force-dynamic'

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-xs uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const [posts, submissions, orders] = await Promise.all([
    listPosts(),
    listSubmissions(),
    listOrders(),
  ])
  const configured = isBackendConfigured()

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold uppercase tracking-wide">
          Dashboard
        </h1>
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${
            configured
              ? 'border-green-800 bg-green-950 text-green-400'
              : 'border-amber-800 bg-amber-950 text-amber-400'
          }`}
        >
          {configured ? 'Supabase connected' : 'In-memory (dev)'}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Published posts" value={posts.filter((p) => p.published).length} />
        <Stat label="Contact submissions" value={submissions.length} />
        <Stat label="Orders" value={orders.length} />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide">
              Recent posts
            </h2>
            <a
              href="/posts"
              className="text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
            >
              Manage
            </a>
          </div>
          <ul className="mt-4 space-y-3">
            {posts.slice(0, 4).map((p) => (
              <li key={p.id} className="text-sm text-neutral-300">
                {p.title}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide">
              Latest submissions
            </h2>
            <a
              href="/submissions"
              className="text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
            >
              View
            </a>
          </div>
          <ul className="mt-4 space-y-3">
            {submissions.slice(0, 4).map((s) => (
              <li key={s.id} className="text-sm text-neutral-300">
                <span className="text-white">{s.name}</span>
                <span className="text-neutral-500"> — {s.email}</span>
              </li>
            ))}
            {submissions.length === 0 && (
              <li className="text-sm text-neutral-500">No submissions yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
