import type { Metadata } from 'next'
import { SiteHeader, SiteFooter } from '@ecs/shared'
import { Providers } from '@/components/Providers'
import { HEADER_LINKS, FOOTER_LINKS } from '@/lib/nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'ECS Network',
  description:
    'A creative network across apparel, media, retail and ventures.',
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
          <SiteHeader brand="ECS Network" links={HEADER_LINKS} />
          <main className="min-h-[70vh]">{children}</main>
          <SiteFooter brand="ECS Network" links={FOOTER_LINKS} />
        </Providers>
      </body>
    </html>
  )
}
