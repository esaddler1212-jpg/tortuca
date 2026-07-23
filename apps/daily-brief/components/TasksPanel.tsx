'use client'

import { useState, type FormEvent } from 'react'
import type { Task } from '@/lib/store'

export function TasksPanel({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initial)
  const [adding, setAdding] = useState(false)

  async function toggle(id: string, done: boolean) {
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, done } : t)))
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      })
    } catch {
      setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, done: !done } : t)))
    }
  }

  async function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('title') as HTMLInputElement
    const title = input.value.trim()
    if (!title) return
    setAdding(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = (await res.json()) as { task?: Task }
      if (data.task) {
        setTasks((cur) => [data.task!, ...cur])
        form.reset()
      }
    } finally {
      setAdding(false)
    }
  }

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <div>
      <ul className="space-y-2">
        {[...open, ...done].map((t) => (
          <li key={t.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => toggle(t.id, e.target.checked)}
              aria-label={t.title}
              className="h-4 w-4 accent-white"
            />
            <span
              className={
                t.done ? 'text-sm text-neutral-500 line-through' : 'text-sm'
              }
            >
              {t.title}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={addTask} className="mt-4 flex gap-2">
        <input
          name="title"
          placeholder="Add a task"
          className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm placeholder:text-neutral-500"
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
