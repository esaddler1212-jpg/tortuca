'use client'

import { useState, type FormEvent } from 'react'

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setMessage(null)

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && json.ok) {
        setStatus('sent')
        setMessage("Thanks — we'll be in touch.")
        form.reset()
      } else {
        setStatus('error')
        setMessage(json.error ?? 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Could not send. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            Name
          </label>
          <input
            name="name"
            required
            className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-neutral-500">
          Company (optional)
        </label>
        <input
          name="company"
          className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-neutral-500">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {message && (
        <p
          className={
            status === 'error' ? 'text-sm text-red-600' : 'text-sm text-green-700'
          }
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-black px-6 py-3 text-xs uppercase tracking-widest text-white hover:opacity-80 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
