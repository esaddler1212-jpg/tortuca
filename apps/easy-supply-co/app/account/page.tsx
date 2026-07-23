'use client'

import { useState, type FormEvent } from 'react'
import { useAuth } from '@ecs/shared'

const SAMPLE_ORDERS = [
  { id: 'ESC-1042', date: 'Jul 12, 2026', total: '$175.00', status: 'Fulfilled' },
  { id: 'ESC-1031', date: 'Jun 28, 2026', total: '$55.00', status: 'Fulfilled' },
]

export default function AccountPage() {
  const { user, loading, configured, signIn, signUp, signOut } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fn = mode === 'signin' ? signIn : signUp
    const { error } = await fn(email, password)
    if (error) setError(error)
    setBusy(false)
  }

  if (loading) {
    return <p className="text-neutral-500">Loading…</p>
  }

  if (user) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold uppercase tracking-wide">
            Account
          </h1>
          <button
            type="button"
            onClick={signOut}
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
          >
            Sign out
          </button>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Signed in as <span className="text-black">{user.email}</span>
        </p>

        <h2 className="mt-10 text-sm font-medium uppercase tracking-wide">
          Order history
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-widest text-neutral-400">
              <th className="py-2">Order</th>
              <th className="py-2">Date</th>
              <th className="py-2">Total</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ORDERS.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100">
                <td className="py-3">{o.id}</td>
                <td className="py-3 text-neutral-500">{o.date}</td>
                <td className="py-3 tabular-nums">{o.total}</td>
                <td className="py-3 text-neutral-500">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold uppercase tracking-wide">
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </h1>

      {!configured && (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Supabase auth is not configured. Add your keys to
          <code className="mx-1">.env.local</code> to enable sign in.
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy || !configured}
          className="w-full bg-black py-3 text-xs uppercase tracking-widest text-white hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="mt-4 text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
      >
        {mode === 'signin'
          ? 'Need an account? Sign up'
          : 'Have an account? Sign in'}
      </button>
    </div>
  )
}
