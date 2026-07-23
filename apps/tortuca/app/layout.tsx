import type { Metadata } from 'next'
import { AdminNav } from '@/components/AdminNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tortuca — ECS Admin',
  description: 'Shared backend & admin dashboard for the ECS Network.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AdminNav />
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      </body>
    </html>
  )
}
