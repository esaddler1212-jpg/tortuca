'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@ecs/shared'
import { CartProvider } from './CartProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}
