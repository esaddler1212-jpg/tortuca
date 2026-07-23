import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Daily Brief — ECS',
  description: 'Your personal daily breakdown across ECS, calendar and email.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="mx-auto max-w-5xl px-5 py-10">{children}</div>
      </body>
    </html>
  )
}
