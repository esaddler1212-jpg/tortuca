'use client'

import { useState } from 'react'
import type { Product } from '@ecs/shared'
import { useCart } from './CartProvider'

export function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  if (!product.available) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed border border-neutral-200 py-3 text-xs uppercase tracking-widest text-neutral-400"
      >
        Sold out
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(product)
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
      }}
      className="w-full bg-black py-3 text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-80"
    >
      {added ? 'Added ✓' : 'Add to cart'}
    </button>
  )
}
