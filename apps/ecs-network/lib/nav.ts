import type { NavLink } from '@ecs/shared'

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001'

export const HEADER_LINKS: NavLink[] = [
  { label: 'Divisions', href: '/#divisions' },
  { label: 'Journal', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shop', href: STORE_URL, external: true },
]

export const FOOTER_LINKS: NavLink[] = [
  { label: 'Journal', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shop', href: STORE_URL, external: true },
]
