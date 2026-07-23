'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartLine, Product } from '@ecs/shared'

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  add: (product: Product, quantity?: number) => void
  remove: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)
const STORAGE_KEY = 'ecs.cart.v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw) as CartLine[])
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // ignore write failures
    }
  }, [lines, hydrated])

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0)
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0)
    return {
      lines,
      count,
      subtotal,
      add(product, quantity = 1) {
        setLines((current) => {
          const existing = current.find((l) => l.product.id === product.id)
          if (existing) {
            return current.map((l) =>
              l.product.id === product.id
                ? { ...l, quantity: l.quantity + quantity }
                : l,
            )
          }
          return [...current, { product, quantity }]
        })
      },
      remove(productId) {
        setLines((current) => current.filter((l) => l.product.id !== productId))
      },
      setQuantity(productId, quantity) {
        setLines((current) =>
          quantity <= 0
            ? current.filter((l) => l.product.id !== productId)
            : current.map((l) =>
                l.product.id === productId ? { ...l, quantity } : l,
              ),
        )
      },
      clear() {
        setLines([])
      },
    }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>')
  return ctx
}
