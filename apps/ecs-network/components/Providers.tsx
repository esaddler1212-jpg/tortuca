'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@ecs/shared'

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
