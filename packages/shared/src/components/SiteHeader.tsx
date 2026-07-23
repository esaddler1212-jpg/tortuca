import type { NavLink } from '../types'

interface SiteHeaderProps {
  brand: string
  tagline?: string
  links?: NavLink[]
  /** Optional slot rendered on the right (e.g. cart, account). */
  actions?: React.ReactNode
}

export function SiteHeader({ brand, tagline, links = [], actions }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold uppercase tracking-[0.2em]">
            {brand}
          </span>
          {tagline && (
            <span className="hidden text-xs uppercase tracking-widest text-neutral-400 sm:inline">
              {tagline}
            </span>
          )}
        </a>

        <nav className="flex items-center gap-6">
          <ul className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer' : undefined}
                  className="text-sm uppercase tracking-wide text-neutral-600 transition-colors hover:text-black"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {actions}
        </nav>
      </div>
    </header>
  )
}
