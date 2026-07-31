"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/ClerkShell";

const nav = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/my-list", label: "My List" },
  { href: "/pricing", label: "Plans" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isWatch = pathname.startsWith("/watch");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isWatch) return null;

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-colors duration-300",
        scrolled ? "bg-surface/95 shadow-lg shadow-black/40 backdrop-blur-md" : "bg-gradient-to-b from-black/80 to-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white">
            Tort<span className="text-accent">uca</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-white"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white md:hidden"
          >
            Search
          </Link>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
