'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { AdminPost } from '@/lib/store'

export default function PostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/posts', { cache: 'no-store' })
      const data = (await res.json()) as { posts: AdminPost[] }
      setPosts(data.posts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const form = e.currentTarget
    const payload = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { post?: AdminPost; error?: string }
      if (res.ok && data.post) {
        setPosts((current) => [data.post as AdminPost, ...current])
        form.reset()
      } else {
        setError(data.error ?? 'Failed to create post')
      }
    } catch {
      setError('Network error while creating post')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-wide">Posts</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide">
            New post
          </h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <Field name="title" label="Title" />
            <Field name="excerpt" label="Excerpt" />
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500">
                Content
              </label>
              <textarea
                name="content"
                required
                rows={5}
                className="mt-1 w-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <Field name="author" label="Author (optional)" required={false} />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-white py-3 text-xs uppercase tracking-widest text-black hover:opacity-80 disabled:opacity-50"
            >
              {busy ? 'Publishing…' : 'Publish post'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
            {loading ? 'Loading…' : `${posts.length} posts`}
          </h2>
          <ul className="mt-4 divide-y divide-neutral-800 border-y border-neutral-800">
            {posts.map((p) => (
              <li key={p.id} className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{p.title}</span>
                  <span className="shrink-0 text-xs uppercase tracking-widest text-neutral-500">
                    {p.author}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-400">{p.excerpt}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function Field({
  name,
  label,
  required = true,
}: {
  name: string
  label: string
  required?: boolean
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-neutral-500">
        {label}
      </label>
      <input
        name={name}
        required={required}
        className="mt-1 w-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
      />
    </div>
  )
}
