const LINKS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Posts', href: '/posts' },
  { label: 'Submissions', href: '/submissions' },
  { label: 'Orders', href: '/orders' },
]

export function AdminNav() {
  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold uppercase tracking-[0.2em]">
            Tortuca
          </span>
          <span className="hidden text-xs uppercase tracking-widest text-neutral-500 sm:inline">
            ECS Admin
          </span>
        </a>
        <nav>
          <ul className="flex items-center gap-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm uppercase tracking-wide text-neutral-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
