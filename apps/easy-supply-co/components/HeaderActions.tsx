'use client'

import { useCart } from './CartProvider'

export function HeaderActions() {
  const { count } = useCart()
  return (
    <div className="flex items-center gap-5">
      <a
        href="/account"
        className="text-sm uppercase tracking-wide text-neutral-600 hover:text-black"
      >
        Account
      </a>
      <a
        href="/cart"
        className="relative text-sm uppercase tracking-wide text-neutral-600 hover:text-black"
      >
        Cart
        <span className="ml-1 tabular-nums">({count})</span>
      </a>
    </div>
  )
}
