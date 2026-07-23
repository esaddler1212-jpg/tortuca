import type { Metadata } from 'next'
import { SiteHeader, SiteFooter } from '@ecs/shared'
import { Providers } from '@/components/Providers'
import { HeaderActions } from '@/components/HeaderActions'
import { HEADER_LINKS, FOOTER_LINKS } from '@/lib/nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Easy Supply Co',
  description: 'Elevated everyday basics from the ECS Network.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <SiteHeader
            brand="Easy Supply Co"
            tagline="ECS Network"
            links={HEADER_LINKS}
            actions={<HeaderActions />}
          />
          <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-10">
            {children}
          </main>
          <SiteFooter brand="Easy Supply Co" links={FOOTER_LINKS} />
        </Providers>
      </body>
    </html>
  )
}
