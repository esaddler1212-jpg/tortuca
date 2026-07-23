'use client'

import { useState, type FormEvent } from 'react'
import type { Tracker } from '@/lib/store'

export function TrackersPanel({ initial }: { initial: Tracker[] }) {
  const [trackers, setTrackers] = useState<Tracker[]>(initial)
  const [adding, setAdding] = useState(false)

  async function adjust(id: string, delta: number) {
    // Optimistic update.
    setTrackers((cur) =>
      cur.map((t) =>
        t.id === id ? { ...t, value: Math.max(0, t.value + delta) } : t,
      ),
    )
    try {
      const res = await fetch(`/api/trackers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      })
      const data = (await res.json()) as { tracker?: Tracker }
      if (data.tracker) {
        setTrackers((cur) => cur.map((t) => (t.id === id ? data.tracker! : t)))
      }
    } catch {
      // Revert on failure.
      setTrackers((cur) =>
        cur.map((t) =>
          t.id === id ? { ...t, value: Math.max(0, t.value - delta) } : t,
        ),
      )
    }
  }

  async function addTracker(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const label = (form.elements.namedItem('label') as HTMLInputElement).value.trim()
    const unit = (form.elements.namedItem('unit') as HTMLInputElement).value.trim()
    if (!label) return
    setAdding(true)
    try {
      const res = await fetch('/api/trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, unit: unit || undefined }),
      })
      const data = (await res.json()) as { tracker?: Tracker }
      if (data.tracker) {
        setTrackers((cur) => [...cur, data.tracker!])
        form.reset()
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <ul className="space-y-3">
        {trackers.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
          >
            <div>
              <p className="text-sm">{t.label}</p>
              {t.unit && (
                <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                  {t.unit}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Decrease ${t.label}`}
                onClick={() => adjust(t.id, -1)}
                className="h-7 w-7 rounded-full border border-white/15 text-sm hover:bg-white/10"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-semibold tabular-nums">
                {t.value}
              </span>
              <button
                type="button"
                aria-label={`Increase ${t.label}`}
                onClick={() => adjust(t.id, 1)}
                className="h-7 w-7 rounded-full border border-white/15 text-sm hover:bg-white/10"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={addTracker} className="mt-4 flex gap-2">
        <input
          name="label"
          placeholder="New tracker (e.g. Songs written)"
          className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm placeholder:text-neutral-500"
        />
        <input
          name="unit"
          placeholder="unit"
          className="w-20 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-white px-4 py-2 text-xs uppercase tracking-widest text-black hover:opacity-80 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  )
}
