import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-surface-raised py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-white">
              Tort<span className="text-accent">uca</span>
            </p>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              A home for short films — festival picks, emerging voices, and stories
              under twenty minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            <Link href="/browse" className="hover:text-zinc-300">
              Browse
            </Link>
            <Link href="/search" className="hover:text-zinc-300">
              Search
            </Link>
            <span className="text-zinc-700">|</span>
            <span>© {new Date().getFullYear()} Tortuca</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
