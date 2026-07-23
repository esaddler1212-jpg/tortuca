import { BlogCard, DIVISIONS } from '@ecs/shared'
import { getPosts } from '@/lib/blog'

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'

export default async function HomePage() {
  const posts = await getPosts()
  const latest = posts.slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-20">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Creative Network
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.03] tracking-tight sm:text-7xl">
          One studio. Four divisions. Built easy.
        </h1>
        <p className="mt-6 max-w-xl text-neutral-500">
          ECS Network operates across apparel, media, retail and ventures —
          under a single, minimal creative direction.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#divisions"
            className="bg-black px-6 py-3 text-xs uppercase tracking-widest text-white hover:opacity-80"
          >
            Explore divisions
          </a>
          <a
            href={STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-neutral-300 px-6 py-3 text-xs uppercase tracking-widest hover:bg-neutral-50"
          >
            Shop Easy Supply
          </a>
        </div>
      </section>

      {/* Divisions */}
      <section
        id="divisions"
        className="border-t border-neutral-200 bg-neutral-50"
      >
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400">
            Divisions
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
            {DIVISIONS.map((d) => (
              <div key={d.slug} className="bg-white p-8">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {d.name}
                  </h3>
                  <span className="text-xs uppercase tracking-widest text-neutral-400">
                    {d.tagline}
                  </span>
                </div>
                <p className="mt-3 max-w-sm text-sm text-neutral-500">
                  {d.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400">
            From the journal
          </h2>
          <a
            href="/blog"
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
          >
            All posts
          </a>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {latest.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
