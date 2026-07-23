'use client'

import { useState } from 'react'
import { formatPrice } from '@ecs/shared'
import { useCart } from '@/components/CartProvider'

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove, clear } = useCart()
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function checkout() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({
            id: l.product.id,
            title: l.product.title,
            price: l.product.price,
            currency: l.product.currency,
            quantity: l.quantity,
          })),
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setStatus(data.error ?? 'Checkout is unavailable right now.')
    } catch {
      setStatus('Could not reach checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold uppercase tracking-wide">Cart</h1>
        <p className="mt-6 text-neutral-500">Your cart is empty.</p>
        <a
          href="/products"
          className="mt-6 inline-block bg-black px-6 py-3 text-xs uppercase tracking-widest text-white hover:opacity-80"
        >
          Continue shopping
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold uppercase tracking-wide">Cart</h1>

      <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {lines.map((line) => (
          <li key={line.product.id} className="flex items-center gap-4 py-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
              {line.product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.product.image}
                  alt={line.product.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{line.product.title}</p>
              <p className="text-sm text-neutral-500">
                {formatPrice(line.product.price, line.product.currency)}
              </p>
              <button
                type="button"
                onClick={() => remove(line.product.id)}
                className="mt-1 text-xs uppercase tracking-widest text-neutral-400 hover:text-black"
              >
                Remove
              </button>
            </div>
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) =>
                setQuantity(line.product.id, Number(e.target.value))
              }
              className="w-16 border border-neutral-300 px-2 py-1 text-center text-sm"
              aria-label={`Quantity for ${line.product.title}`}
            />
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-neutral-400">
          Subtotal
        </span>
        <span className="text-lg font-medium tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </div>

      {status && <p className="mt-4 text-sm text-red-600">{status}</p>}

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={checkout}
          disabled={loading}
          className="flex-1 bg-black py-3 text-xs uppercase tracking-widest text-white hover:opacity-80 disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : 'Checkout'}
        </button>
        <button
          type="button"
          onClick={clear}
          className="border border-neutral-300 px-6 py-3 text-xs uppercase tracking-widest hover:bg-neutral-50"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
