import type { NavLink } from '../types'

interface SiteFooterProps {
  brand: string
  links?: NavLink[]
}

export function SiteFooter({ brand, links = [] }: SiteFooterProps) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">
            {brand}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            &copy; {year} ECS Network. All rights reserved.
          </p>
        </div>
        <ul className="flex flex-wrap gap-5">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                className="text-xs uppercase tracking-wide text-neutral-500 hover:text-black"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
