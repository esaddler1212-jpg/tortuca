import type { NavLink } from '@ecs/shared'

const NETWORK_URL =
  process.env.NEXT_PUBLIC_NETWORK_URL || 'http://localhost:3002'

export const HEADER_LINKS: NavLink[] = [
  { label: 'Shop', href: '/products' },
  { label: 'About', href: '/about' },
  { label: 'ECS Network', href: NETWORK_URL, external: true },
]

export const FOOTER_LINKS: NavLink[] = [
  { label: 'Shop', href: '/products' },
  { label: 'Account', href: '/account' },
  { label: 'ECS Network', href: NETWORK_URL, external: true },
]
